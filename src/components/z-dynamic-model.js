import AFRAME from 'aframe/src';

AFRAME.registerComponent('z-dynamic-model', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    _unknownInts: { type: 'array' },
    _unknownInts2: { type: 'array' },
    _unknownFloats: { type: 'array' },
    _unknownVector: { type: 'array' },
    _unknownThings: { type: 'string' },
  },

  update() {
    const { object3D } = this.el;
    const { position, rotation } = this.data;
    object3D.position.fromArray(position);
    object3D.rotation.y = Math.atan2(rotation[0], rotation[2]);
  },
});
