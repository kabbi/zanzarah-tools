import AFRAME, { THREE } from 'aframe/src';

AFRAME.registerComponent('z-light', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    type: { type: 'string' },
    color: { type: 'array' },
    param: { type: 'number' },
    _unknownVector: { type: 'array' },
    _unknownVectors: { type: 'array' },
    _unknownInt: { type: 'number' },
    _unknownFloat: { type: 'number' },
  },

  update() {
    const { object3D } = this.el;
    const { type } = this.data;

    switch (type) {
      case 'UnknownLight1': {
        const { _unknownVectors: [ position, rotation ] } = this.data;
        object3D.position.fromArray(position);
        const [ ra, rb, rc ] = rotation;
        object3D.rotation.z = Math.atan2(ra, rb);
        object3D.rotation.y = Math.atan2(ra, rc);
        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0xffffff,
          0.4,
          0.3
        );
        arrow.cone.material.wireframe = true;
        this.el.setObject3D('mesh', arrow);
        break;
      }
      default:
        break;
    }
  },
});
