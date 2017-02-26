// const jBinary = require('jbinary');
// const debug = require('debug')('app:parsers:pack');

const {
  Hex,
  Tap,
  ChildChunk,
  DumpContext,
  DynamicArray,
  BitFlags,
} = require('../utils/jbinary');

exports.typeSet = {
  'jBinary.all': 'SectionList',
  'jBinary.littleEndian': true,

  Hex,
  Tap,
  BitFlags,
  ChildChunk,
  DumpContext,
  DynamicArray,

  // >TODO: Implement
};
