#!/usr/bin/env node
const jBinary = require('jbinary');

const {
  Hex,
  Tap,
  ChildChunk,
  DumpContext,
  DynamicArray,
  BitFlags,
  parent,
} = require('../utils/jbinary');

const {
  SectionTypes,
  GeometryFlags,
  WorldFlags,
} = require('./renderware-constants');

// Some utility parsing methods

const sectionVersionEquals = target => function () {
  const { version } = this.binary.getContext(2);
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
  // RwData always contains data, no child sections
  if (context.type === 'RwData') {
    return true;
  }
  // There are some static sections that we can parse directly
  if (exports.typeSet[context.type]) {
    return true;
  }
  const parent = this.binary.getContext(2);
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

  SectionList: ['array', 'Section'],
  Section: ['extend', {
    type: ['enum', 'uint32', SectionTypes],
    size: 'uint32',
    version: 'uint16',
    _unknown: 'uint16',
    // _: ['DumpContext', '>'],
  }, ['if', isDataSection, {
    data: 'SectionData',
  }, {
    children: ['ChildChunk', 'SectionList', function () {
      const { type, size } = this.binary.getContext(1);
      // HACK: Fix-up the size of root section: make it always the size of the
      // file, as in some files it has strange size specified, so that last inner
      // sections overlap with the root section end (start inside, end outside).
      // I have no idea why is this so.
      return type === 'RwClump' ? (this.view.byteLength - (12 * 2)) : size;
    }],
  }] /* , ['DumpContext', '<'] */],

  SectionData: jBinary.Template({
    getBaseType() {
      // Data section format may depend on parent (for RwData) or grandparent
      // (for RwExtension children) section type. So we try several combinations
      // here (up to 3 in depth)
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

  UnsupportedSectionData: {
    _unknownData: ['blob', 'size'],
  },

  // Static sections
  RwString: ['string0', parent('size')],
  RwEof: [],

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
    flags: 'uint32',
    triangleCount: 'uint32',
    vertexCount: 'uint32',
    morphTargetCount: 'uint32',
    lighting: 'Lighting',
  }, ['if', context => context.flags & GeometryFlags.RwPrelit, {
    vertexColors: ['array', 'Color', 'vertexCount'],
  }], ['if', context => context.flags & GeometryFlags.RwTextured, {
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
  }, ['if', context => context.flags & GeometryFlags.RwNormals, {
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
    filterMode: 'uint8',
    addrModeU: 'uint8',
    addrModeV: 'uint8',
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
    triangleStrip: 'uint32',
    splitCount: 'uint32',
    faceCount: 'uint32',
    splits: ['array', 'MaterialSplit', 'splitCount'],
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
    faceIndex: 'uint32',
    materialIndex: 'uint32',
    indices: ['array', 'uint32', 'faceIndex'],
  },
};

if (require.main === module) {
  const args = require('yargs')
    .usage('Usage: $0 [options]')
    .boolean('status-only')
    .demandCommand(1, 'You must specify the file to parse')
    .describe('status-only', 'Output only parsing status, success or fail')
    .help()
    .argv;
  const [ fileName ] = args._;
  jBinary.load(fileName, exports.typeSet)
    .then(binary => {
      const data = binary.readAll();
      if (args.statusOnly) {
        console.log('OK', fileName);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    })
    .catch(err => {
      if (args.statusOnly) {
        console.log('FAILED', fileName);
      } else {
        console.error('Fatal error, cannot continue:', err);
      }
    });
}
