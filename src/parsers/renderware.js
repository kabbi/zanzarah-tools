const jBinary = require('jbinary');
const debug = require('debug')('app:parsers:renderware');

const {
  Hex,
  Tap,
  ChildChunk,
  DumpContext,
  DynamicArray,
  DynamicString,
  BitFlags,
} = require('../utils/jbinary');

const {
  SectionTypes,
  GeometryFlags,
  WorldFlags,
  FilterModes,
  AddressModes,
  FaceTypes,
} = require('./renderware-constants');

// Some utility parsing methods

const sectionVersionEquals = target => function () {
  const { version } = this.binary.getContext(1);
  return version === target;
};

const unexpectedValueError = type => function (value) {
  throw new Error(`Unexpected ${type} field, found ${value}, expected ${this.value}`);
};

const RootDataToken = Symbol('parserData');
const setRootData = function (context) {
  // HACK: This is a method to set root data from any section, like those that
  // are not present in context chain and cannot be accessed in children sections.
  // This is used to pass world flags for bsp files from world data section to
  // any other.
  this.binary.getContext(c => c.type === 'RwWorld')[RootDataToken] = context;
};
const hasRootFlag = flag => function () {
  const { flags } = this.binary.getContext(context => (
    context[RootDataToken]
  ))[RootDataToken];
  return flags[flag];
};

const isDataSection = function (context) {
  debug('Detecting section type', this.binary.contexts);
  // RwData always contains data, no child sections
  if (context.type === 'RwData') {
    return true;
  }
  // There are some static sections that we can parse directly
  if (exports.typeSet[context.type]) {
    return true;
  }
  const parent = this.binary.getContext(1);
  // Every child of RwExtension can only contain data
  if (parent && parent.type === 'RwExtension') {
    return true;
  }
  return false;
};

exports.typeSet = {
  'jBinary.all': 'SectionList',
  'jBinary.littleEndian': true,

  Hex,
  Tap,
  BitFlags,
  ChildChunk,
  DumpContext,
  DynamicArray,
  DynamicString,

  SectionHeader: {
    type: ['enum', 'uint32', SectionTypes],
    size: 'uint32',
    version: 'uint16',
    _unknown: 'uint16',
  },
  SectionList: ['array', 'Section'],
  SectionData: jBinary.Template({
    getBaseType() {
      // Data section format may depend on parent (for RwData) or grandparent
      // (for RwExtension children) section type. So we try several combinations
      // here (up to 3 in depth)
      debug('Detecting section data type', this.binary.contexts);
      const sectionHierarchy = this.binary.contexts.filter(c => c.type).map(c => c.type);
      for (let i = 1; i <= Math.min(3, sectionHierarchy.length); i++) {
        const type = sectionHierarchy.slice(0, i).reverse().join('->');
        if (exports.typeSet[type]) {
          return type;
        }
      }
      return 'UnsupportedSectionData';
    },
  }),

  Section: jBinary.Type({
    read() {
      const header = this.binary.read('SectionHeader');

      const { type, size } = header;
      let estimatedSize = size;
      if (type === 'RwClump') {
        // HACK: Fix-up the size of root section: make it always the size of the
        // file, as in some files it has strange size specified, so that last inner
        // sections overlap with the root section end (start inside, end outside).
        // I have no idea why is this so.
        estimatedSize = this.view.byteLength - 12;
      }

      // Put header in context so that we can access section hierarchy in downstream
      // type handlers (isDataSection, SectionData, etc depend on this behaviour)
      return this.binary.inContext(header, () => {
        const dataSection = isDataSection.call(this, header);
        const contentType = dataSection ? 'SectionData' : 'SectionList';

        debug('>', header, contentType);
        const content = this.binary.read(['ChildChunk', contentType, estimatedSize]);
        debug('<', header, content);

        const section = Object.assign({}, header);
        section[dataSection ? 'data' : 'children'] = content;
        delete section.size;
        return section;
      });
    },
    write(section) {
      debug('Writing section', section);
      const offset = this.binary.tell();
      const headerSize = this.binary.write('SectionHeader', section);
      // Populate known section sizes
      const augmentedSection = Object.assign({}, section);
      if (section.type === 'RwString') {
        const { length } = section.data;
        augmentedSection.size = Math.ceil(length / 4) * 4;
      }
      if (section.data && section.data._unknownData) {
        const { length } = section.data._unknownData;
        augmentedSection.size = length;
      }
      // Finally just write the section down
      return this.binary.inContext(augmentedSection, () => {
        const bytesWritten = section.children ? (
          this.binary.write('SectionList', section.children)
        ) : (
          this.binary.write('SectionData', section.data)
        );
        // We now know section size, write it back in the header
        this.binary.write('uint32', bytesWritten, offset + 4);
        debug('Bytes written', bytesWritten);
        return headerSize + bytesWritten;
      });
    },
  }),

  UnsupportedSectionData: {
    _unknownData: ['blob', 'size'],
  },

  // Static sections
  RwString: ['string0', 'size'],

  // Model sections
  'RwClump->RwData': {
    count: 'uint32',
  },
  'RwFrameList->RwData': {
    frames: ['DynamicArray', 'Frame'],
  },
  'RwAtomic->RwData': ['extend', {
    frameIndex: 'uint32',
    geometryIndex: 'uint32',
    _unknown1: 'uint32',
  }, ['if', sectionVersionEquals(0x0304), {
    _unknown2: 'uint32',
  }]],
  'RwGeometryList->RwData': {
    geometryCount: 'uint32',
  },
  'RwGeometry->RwData': ['extend', {
    flags: ['BitFlags', 'uint32', GeometryFlags],
    triangleCount: 'uint32',
    vertexCount: 'uint32',
    morphTargetCount: 'uint32',
    lighting: 'Lighting',
  }, ['if', context => context.flags.RwPrelit, {
    vertexColors: ['array', 'Color', 'vertexCount'],
  }], ['if', context => context.flags.RwTextured, {
    textureCoords: ['array', 'Vector2', 'vertexCount'],
  }], {
    indices: ['array', ['array', 'uint16', 4], 'triangleCount'],
    boundingSphere: {
      position: 'Vector3',
      radius: 'float32',
    },
    extraInfo: {
      hasPositions: 'uint32',
      hasNormals: 'uint32',
    },
    vertices: ['array', 'Vector3', 'vertexCount'],
  }, ['if', context => context.flags.RwNormals, {
    normals: ['array', 'Vector3', 'vertexCount'],
  }]],
  'RwMaterialList->RwData': {
    count: 'uint32',
    _unknown: ['array', 'int32', 'count'],
  },
  'RwMaterial->RwData': ['extend', {
    _unknown1: 'uint32',
    color: 'Color',
    _unknown2: 'uint32',
    textureCount: 'uint32',
  }, ['if', sectionVersionEquals(0x0304), {
    lighting: 'Lighting',
  }], ['if', sectionVersionEquals(0x0310), {
    _unknown3: 'Vector3',
  }]],
  'RwTexture->RwData': {
    filterMode: ['enum', 'uint8', FilterModes],
    addrModeU: ['enum', 'uint8', AddressModes],
    addrModeV: ['enum', 'uint8', AddressModes],
    _padding: ['const', 'uint8', 0, unexpectedValueError('texture')],
  },

  // World-specific sections
  'RwWorld->RwData': ['extend', {
    rootIsWorldSector: 'uint32',
    invWorldOrigin: 'Vector3',
    lighting: 'Lighting',
    triangleCount: 'uint32',
    vertexCount: 'uint32',
    planeSectorCount: 'uint32',
    worldSectorCount: 'uint32',
    colSectorSize: 'uint32',
    flags: ['BitFlags', 'uint32', WorldFlags],
  }, ['Tap', setRootData]],
  'RwPlaneSector->RwData': {
    sectorType: 'uint32',
    value: 'float32',
    leftIsWorldSector: 'uint32',
    rightIsWorldSector: 'uint32',
    leftValue: 'float32',
    rightValue: 'float32',
  },
  'RwAtomicSector->RwData': ['extend', {
    materialIndex: 'uint32',
    triangleCount: 'uint32',
    vertexCount: 'uint32',
    boundingBox: ['array', 'Vector3', 2],
    _unknown1: 'uint32',
    _unknown2: 'uint32',
    vertices: ['array', 'Vector3', 'vertexCount'],
  }, ['if', hasRootFlag('RwNormals'), {
    normals: ['array', ['array', 'uint8', 4], 'vertexCount'],
  }], ['if', hasRootFlag('RwPrelit'), {
    colors: ['array', 'Color', 'vertexCount'],
  }], ['if', hasRootFlag('RwTextured'), {
    textureCoords: ['array', 'Vector2', 'vertexCount'],
  }], ['if', hasRootFlag('RwTextured2'), {
    textureCoords2: ['array', 'Vector2', 'vertexCount'],
  }], {
    indices: ['array', ['array', 'uint16', 4], 'triangleCount'],
  }],

  // Extension sections
  'RwGeometry->RwExtension->RwMaterialSplit': {
    faceType: ['enum', 'uint32', FaceTypes],
    splitCount: 'uint32',
    faceCount: 'uint32',
    splits: ['array', 'MaterialSplit', 'splitCount'],
  },
  'RwAtomicSector->RwExtension->RwMaterialSplit': {
    faceType: ['enum', 'uint32', FaceTypes],
    splitCount: 'uint32',
    faceCount: 'uint32',
    splits: ['array', 'MaterialSplit', 'splitCount'],
  },
  'RwFrameList->RwExtension->RwAnimPlugin': ['extend', {
    boneId: 'int32',
    _unknownFlag: 'uint32',
  }, ['if', '_unknownFlag', {
    _unknown: 'uint32',
    _unknownCount1: 'uint32',
    _unknownCount2: 'uint32',
    _uknownItems1: ['array', 'AnimationData', '_unknownCount1'],
    _uknownItems2: ['array', 'AnimationData', '_unknownCount2'],
  }]],
  'RwAtomic->RwExtension->RwSkinPlugin': {
    boneCount: 'uint32',
    vertexCount: 'uint32',
    boneIndices: ['array', ['array', 'uint8', 4], 'vertexCount'],
    boneWeights: ['array', ['array', 'float32', 4], 'vertexCount'],
    bones: ['array', 'Bone', 'boneCount'],
  },

  // Generic types
  Color: ['Hex', 'uint32', 8],
  Vector2: ['array', 'float32', 2],
  Vector3: ['array', 'float32', 3],
  Matrix9: ['array', 'float32', 9],
  Lighting: {
    ambient: 'float32',
    specular: 'float32',
    diffuse: 'float32',
  },
  Frame: {
    transform: 'Matrix9',
    offset: 'Vector3',
    parentFrame: 'int32',
    _unknown: 'uint32',
  },
  MaterialSplit: {
    count: 'uint32', // In other sources - faceIndex
    materialIndex: 'uint32',
    indices: ['array', 'uint32', 'count'],
  },
  Bone: {
    id: 'uint32',
    index: 'uint32',
    _unknown3: 'uint32',
    inverseBindMatrix: 'InverseBindMatrix',
  },
  InverseBindMatrix: {
    right: 'Vector3',
    flags: 'uint32',
    up: 'Vector3',
    _padding1: 'uint32',
    at: 'Vector3',
    _padding2: 'uint32',
    pos: 'Vector3',
    _padding3: 'uint32',
  },
  AnimationData: ['extend', {
    name: 'DynamicString',
    type: 'uint32',
    _unknownCount1: 'uint32',
    _unknownCount2: 'uint32',
  }, ['if', context => context.type === 1, {
    _unknownItems1: ['array', ['array', 'float32', 3], '_unknownCount1'],
  }], ['if', context => context.type === 2, {
    _unknownItems1: ['array', ['array', 'float32', 4], '_unknownCount1'],
  }], {
    _unknownItems2: ['array', {
      _unknown1: 'uint32',
      _unknown2: 'uint32',
      _unknown3: 'float32',
    }, '_unknownCount2'],
  }],
};
