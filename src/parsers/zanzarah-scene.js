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
  EffectTypesV2,
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
        Object.assign(value[name] || {}, {
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
    // Seems to be some position + rotation
    _unknownVector1: 'Vector3',
    _unknownVector2: 'Vector3',
    _unknownBytes: ['array', 'uint8', 4],
    // 0...3
    _flag: 'uint8',
  }, ['if', '_flag', {
    _unknownOptionalBytes: ['array', 'uint8', 4],
    _unknownFloat: 'float32',
  }], {
    _unknownFloats: ['array', 'float32', 2],
  }],
  LightsData: {
    lights: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', LightTypes],
      color: 'FloatColor',
      // [ 1, 3, 2 ]
      _unknownInt: 'uint32',
    }, ['if', context => context.type === 'UnknownLight1', {
      _unknownVectors: ['array', 'Vector3', 2],
    }], ['if', context => context.type === 'UnknownLight128', {
      // [ 8, 3, 10, 17, 6, 7, 5, 11, 2, 9, 1, 30 ]
      _unknownFloat: 'float32',
      _unknownVector: 'Vector3',
    }], ['if', context => context.type === 'UnknownLight129', {
      _unknownInt1: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }]]],
  },
  FOModels_v4Data: {
    models: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      position: 'Vector3',
      rotation: 'Vector3',
      // [ 0...5000, 8...5000 ]
      _unknownFloats: ['array', 'float32', 2],
      scale: 'Vector3',
      _unknownColor: 'IntColor',
      // [ '0,0', '1,0', '2,0', '0,1', '1,1', '2,1' ]
      _unknownFlags: ['array', 'uint8', 2],
      // [ 1, 0, 9, 3, 6, 2, 7, 10, 8, 11, 4 ]
      _unknownInt1: 'uint32',
      // [ 0, 1 ]
      _unknownFlag: 'uint8',
      // [ 0, -1, 4, 2, 1, 3 ]
      _unknownInt2: 'int32',
    }],
  },
  Models_v3Data: {
    models: ['DynamicArray', {
      id: 'uint32',
      fileName: 'DynamicString',
      position: 'Vector3',
      rotation: 'Vector3',
      // May not be really scale
      scale: 'Vector3',
      _unknownColor: 'IntColor',
      // Always 0
      _unknownFlag: 'uint8',
      // [ -1, 0, 1, 4, 2, 3 ]
      _unknownInt: 'int32',
      // [ 0, 1 ]
      _unknownFlag2: 'uint8',
    }],
  },
  DynamicModelsData: {
    models: ['DynamicArray', {
      id: 'uint32',
      _unknownInts: ['array', 'uint32', 2],
      position: 'Vector3',
      rotation: 'Vector3',
      _unknownFloats: ['array', 'float32', 2],
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
      // [ 0, 1 ]
      _unknownFlag: 'uint32',
      rotation: 'Vector3',
      // 0...55
      kind: 'uint32',
      params: ['array', 'uint32', 4],
      // [ '', '*' ]
      _unknownString: 'DynamicString',
      position: 'Vector3',
    }, ['if', context => context.type === 'UnknownTrigger0', {
      target: 'Vector3',
    }], ['if', context => context.type === 'UnknownTrigger1', {
      radius: 'float32',
    }]]],
  },
  // Always empty
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
      position: 'Vector3',
      _unknownVectors: ['array', 'Vector3', 2],
      _unknownInts: ['array', 'uint32', 5],
    }],
  },
  EffectsData: {
    effects: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', EffectTypes],
    }, ['if', context => context.type === 'UnknownEffect1', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }, ['if', context => context.type === 'UnknownEffect4', {
      _unknownInt: 'uint32',
      _unknownVector: 'Vector3',
    }, ['if', context => context.type === 'UnknownEffect5', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }, ['if', context => context.type === 'UnknownEffect6', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }, ['if', context => context.type === 'UnknownEffect7', {
      _unknownString: 'DynamicString',
      _unknownVector: 'Vector3',
    }, ['if', context => context.type === 'UnknownEffect10', {
      _unknownInt: 'uint32',
      _unknownVectors: ['array', 'Vector3', 2],
    }, ['if', context => context.type === 'UnknownEffect13', {
      _unknownString: 'DynamicString',
      _unknownVectors: ['array', 'Vector3', 3],
      _unknownInt: 'uint32',
    }]]]]]]]]],
  },
  Effects_v2Data: {
    effects: ['DynamicArray', ['extend', {
      id: 'uint32',
      type: ['enum', 'uint32', EffectTypesV2],
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
    }], ['if', context => context.type === 'UnknownEffect13', {
      _unknownString: 'DynamicString',
      _unknownVectors: ['array', 'Vector3', 3],
      _unknownInt: 'uint32',
    }], ['if', context => context.type === 'SnowFlakesEffect', {
      _unknownInt: 'uint32',
    }]]],
  },
  AmbientSoundData: {
    // 0...17
    _unknownValue: 'uint32',
  },
  MusicData: {
    // [ 0xCDCDCDCD, 0, 2 ]
    _unknownValue: 'uint32',
  },
  SceneData: {
    _unknownItems: ['DynamicArray', {
      // Maybe some comment string
      _unknownString: 'DynamicString',
      // [ [ 0...499 ], [ 4, 10, 6, 5, 0, 2, 3, 8 ] ]
      _unknownInts: ['array', 'uint32', 2],
    }],
  },
  // Always empty
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
      // 900...2017
      type: 'uint32',
      // 0...99
      modelId: 'uint32',
    }],
  },
  DatasetData: {
    // 32 or 36 bytes length
    _unknownData: ['DynamicArray', 'uint8'],
    // Both are always empty
    _unknownStrings: ['array', 'DynamicString', 2],
  },
  SceneOriginData: {
    origin: 'Vector3',
  },
  TexturePropertiesData: {
    properties: ['DynamicArray', {
      fileName: 'DynamicString',
      footstepSound: 'int32',
    }],
  },
  WaypointSystemData: ['extend', {
    // [ 5, 6 ]
    version: 'uint32',
    // Always 0
    empty: 'uint32',
  }, ['if', context => context.version >= 5, {
    _unknownData: ['array', 'uint8', 24],
    _unknownCount: 'uint32',
    _v5: ['array', {
      _unknownInt1: 'uint32',
      _unknownInt2: 'uint32',
      _unknownVector1: 'Vector3',
      _unknownArray1: ['DynamicArray', 'uint32'],
      _unknownArray2: ['DynamicArray', 'uint32'],
    }, '_unknownCount'],
    _v2: ['DynamicArray', {
      _unknownInt: 'uint32',
      _unknownArray: ['DynamicArray', 'uint32'],
    }],
    _v3: ['array', ['DynamicArray', 'uint32'], '_unknownCount'],
  }], {
    _reserved: ['const', 'uint32', 0xFFFF, true],
  }],
  BackdropData: {
    // Some are backdrop model names, some - unique values:
    // 1_Vortex 2_Forest 3_Horizon 5_Swamp 7_Mountain1 10_Garden 12_waterduel
    // 15_DuelSwamp 16_Trainer 17_DuelSpecial 18_DuelLava 19_PreDuel
    fileName: 'DynamicString',
  },
  EOSData: {},

  Vector3: ['array', 'float32', 3],
  FloatColor: ['array', 'float32', 4],
  IntColor: ['Hex', 'uint32', 8],
};
