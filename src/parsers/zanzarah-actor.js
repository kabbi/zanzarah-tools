const jBinary = require('jbinary');

const {
  Switch,
  DumpContext,
  DynamicString,
} = require('../utils/jbinary');

const ArraySections = [
  'AnimationFilename_Body',
  'AnimationFilename_Wings',
];

exports.typeSet = {
  'jBinary.all': 'Actor',
  'jBinary.littleEndian': true,

  Switch,
  DumpContext,
  DynamicString,

  Actor: jBinary.Template({
    baseType: ['array', 'Section'],
    read() {
      // Remove first and last sections - header and eos
      const sections = this.baseRead().slice(1, -1);
      // Index sections by name, collapse those with identical names to arrays
      return sections.reduce((result, section) => {
        const key = section.name.slice(1, -1);
        if (ArraySections.includes(key)) {
          result[key] = result[key] || [];
          result[key].push(section.data);
        } else {
          result[key] = section.data;
        }
        return result;
      }, {});
    },
    write(value) {
      const sectionNames = ['ActorExDescriptionFileData'];
      sectionNames.push(...Object.keys(value));
      sectionNames.push('EOS');
      const sections = [];
      sectionNames.forEach(name => {
        const items = ArraySections.inclues(name) ? value[name] : [value[name]];
        sections.push(...items.map(data => ({
          name: `[${name}]`,
          data,
        })));
      });
      return this.baseWrite(sections);
    },
  }),

  Section: ['extend', {
    name: 'DynamicString',
    data: ['Switch', context => {
      const handler = `${context.name.slice(1, -1)}Data`;
      if (!exports.typeSet[handler]) {
        throw new Error(`Unsupported section: ${context.name}`);
      }
      return handler;
    }],
  }, {
    _: ['DumpContext', null, 1],
  }],

  ActorExDescriptionFileData: {},
  HeadBoneIDData: 'int32',
  EffectBoneIDData: 'int32',
  AttachWingsToBoneData: 'int32',
  ModelFilename_BodyData: DynamicString,
  ModelFilename_WingsData: DynamicString,
  AnimationPoolID_BodyData: 'int32',
  AnimationPoolID_WingsData: 'int32',
  AnimationFilename_BodyData: {
    fileName: DynamicString,
    id: 'int32',
  },
  AnimationFilename_WingsData: {
    fileName: DynamicString,
    id: 'int32',
  },
  EOSData: {},
};
