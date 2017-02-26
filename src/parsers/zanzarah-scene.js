const jBinary = require('jbinary');

const {
  Hex,
  Switch,
  DumpContext,
  DynamicArray,
  DynamicString,
} = require('../utils/jbinary');

const {
  LightTypes,
  TriggerTypes,
  EffectTypes,
} = require('./zanzarah-scene-constants');

exports.typeSet = {
  'jBinary.all': 'Scene',
  'jBinary.littleEndian': true,

  Hex,
  Switch,
  DumpContext,
  DynamicArray,
  DynamicString,

  Scene: jBinary.Template({
    baseType: ['array', 'Section'],
    read() {
      // Remove first and last sections - header and eos
      const sections = this.baseRead().slice(1, -1);
      return sections.reduce((result, section) => {
        result[section.name.slice(1, -1)] = section;
        delete section.name;
        return result;
      }, {});
    },
    write(value) {
      const sectionNames = ['Scenefile'];
      sectionNames.push(...Object.keys(value));
      sectionNames.push('EOS');
      return this.baseWrite(sectionNames.map(name =>
        Object.assign(value[name], {
          name: `[${name}]`,
        })
      ));
    },
  }),

  Section: ['extend', {
    name: 'DynamicString',
  }, ['Switch', context => {
    const handler = `${context.name.slice(1, -1)}Data`;
    if (!exports.typeSet[handler]) {
      throw new Error(`Unsupported section: ${context.name}`);
    }
    return handler;
  }], {
    _: ['DumpContext', null, 1],
  }],

  ScenefileData: {},
  VersionData: {
    author: 'DynamicString',
    _unknown: ['array', 'uint32', 3],
    buildVersion: 'uint32',
    date: 'DynamicString',
    time: 'DynamicString',
    year: 'uint32',
    _unknown1: 'uint32',
  },
  MiscData: ['extend', {
    sceneFile: 'DynamicString',
    scenePath: 'DynamicString',
    texturePath: 'DynamicString',
    _unknownColor: 'FloatColor',
    _unknownVector1: 'Vector3',
    _unknownVector2: 'Vector3',
    _unknownBytes: ['array', 'uint8', 4],
    _flag: 'uint8',
  }, ['if', '_flag', {
    _unknownOptionalBytes: ['array', 'uint8', 4],
    _unknownFloat: 'float32',
  }], {
    _unkownFloats: ['array', 'float32', 2],
  }],
  LightsData: {
    lights: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', LightTypes],
      color: 'FloatColor',
      param: 'uint32',
    }, ['if', context => context.type === 'UnknownLight1', {
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'UnknownLight128', {
      _unknownFloat: 'float32',
      _unkownVector: 'Vector3',
    }], ['if', context => context.type === 'UnknownLight128', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }]]],
  },
  FOModels_v4Data: {
    models: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      _unknownVectors: ['array', 'Vector3', 2],
      _unknownFloats: ['array', 'float32', 5],
      _unknownColor: 'IntColor',
      _unkownFlags: ['array', 'uint8', 2],
      _unkownInt1: 'uint32',
      _unkownFlag: 'uint8',
      _unkownInt2: 'int32',
    }],
  },
  Models_v3Data: {
    models: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      position: 'Vector3',
      rotation: 'Vector3',
      scale: 'Vector3',
      _unknownColor: 'IntColor',
      _unkownFlag1: 'uint8',
      _unknownInt: 'int32',
      _unkownFlag2: 'uint8',
    }],
  },
  DynamicModelsData: {
    models: ['DynamicArray', {
      id: 'uint32',
      _unkownInts: ['array', 'uint32', 2],
      position: 'Vector3',
      rotation: 'Vector3',
      _unkownFloats: ['array', 'float32', 2],
      _unknownVector: 'Vector3',
      _unknownInts2: ['array', 'uint32', 2],
      _unknownThings: ['array', {
        _unknownFloats: ['array', 'float32', 7],
        _unknownFlag: 'uint8',
        _unknownColor: 'IntColor',
        _unknownInt: 'uint32',
        _unknownString1: 'DynamicString',
        _unknownString2: 'DynamicString',
      }, 3],
    }],
  },
  TriggersData: {
    triggers: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', TriggerTypes],
      _unknownFlag: 'uint32',
      _unknownVector: 'Vector3',
      _unknownInts: ['array', 'uint32', 5],
      _unknownString: 'DynamicString',
    }, ['if', context => context.type === 'UnknownTrigger0', {
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'UnknownTrigger1', {
      _unkownVector: 'Vector3',
      _unknownFloat: 'float32',
    }], ['if', context => context.type === 'UnknownTrigger2', {
      _unkownVector: 'Vector3',
    }]]],
  },
  '2DSamples_v2Data': {
    samples: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      _unknownInts: ['array', 'uint32', 2],
      _unknownFlag: 'uint8',
    }],
  },
  '3DSamples_v2Data': {
    samples: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      _unknownVectors: ['array', 'Vector3', 3],
      _unknownInts: ['array', 'uint32', 5],
    }],
  },
  Effects_v2Data: {
    effects: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', EffectTypes],
      _unknownInts: ['array', 'uint32', 5],
    }, ['if', context => context.type === 'UnknownEffect1', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'UnknownEffect6', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'UnknownEffect10', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'SnowFlakesEffect', {
      _unknownInt: 'uint32',
    }]]],
  },
  AmbientSoundData: {
    count: 'uint32',
  },
  MusicData: {
    count: 'uint32',
  },
  SceneData: {
    _unknownItems: ['DynamicArray', {
      _unknownString: 'DynamicString',
      _unknownInts: ['array', 'uint32', 2],
    }],
  },
  VertexModifiersData: {
    modifiers: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: 'uint32',
      _unknownVector: 'Vector3',
      _unknownColor: 'IntColor',
    }, ['if', context => context.type === 1, {
      _unknownVector2: 'Vector3',
    }], {
      _unknownInt: 'uint32',
      _unknownFlag: 'uint8',
    }]],
  },
  BehavioursData: {
    behaviours: ['DynamicArray', {
      type: 'uint32',
      modelId: 'uint32',
    }],
  },
  DatasetData: {
    _unknownData: ['DynamicArray', 'uint8'],
    _unknownStrings: ['array', 'DynamicString', 2],
  },
  SceneOriginData: {
    origin: 'Vector3',
  },
  TexturePropertiesData: {
    properties: ['DynamicArray', {
      fileName: 'DynamicString',
      value: 'int32',
    }],
  },
  WaypointSystemData: ['extend', {
    version: 'uint32',
    empty: 'uint32',
  }, ['if', context => context.version >= 5, {
    _unknownData: ['array', 'uint8', 24],
    _hack: ['array', 'uint32', 2],
  }], {
    _reserved: ['const', 'uint32', 0xFFFF, true],
  }],
  BackdropData: {
    fileName: 'DynamicString',
  },
  EOSData: {},

  Vector3: ['array', 'float32', 3],
  FloatColor: ['array', 'float32', 4],
  IntColor: ['Hex', 'uint32', 8],
};
