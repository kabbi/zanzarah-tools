const { DynamicArray } = require('../utils/jbinary');

exports.typeSet = {
  'jBinary.all': 'Animation',
  'jBinary.littleEndian': true,

  DynamicArray,

  Animation: {
    keyFrameCount: 'uint32',
    flags: 'int32',
    duration: 'float32',
    keyFrames: ['array', 'KeyFrame', 'keyFrameCount'],
  },

  KeyFrame: {
    rotation: ['array', 'float32', 4],
    position: ['array', 'float32', 3],
    time: 'float32',
    parent: 'uint32',
  },
};
