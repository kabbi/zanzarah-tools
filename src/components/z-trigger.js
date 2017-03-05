import AFRAME, { THREE } from 'aframe/src';

AFRAME.registerComponent('z-trigger', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    type: { type: 'string' },
    _unknownFlag: { type: 'number' },
    _unknownVector: { type: 'array' },
    _unknownInts: { type: 'array' },
    _unknownString: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    radius: { type: 'number' },
  },

  update() {
    const { object3D } = this.el;
    const { type, position } = this.data;
    object3D.position.fromArray(position);

    if (type === 'UnknownTrigger1') {
      const { components } = this.el;
      const zEntity = components['z-entity'];
      zEntity.toggleMarker(false);

      const { radius } = this.data;
      const geometry = new THREE.SphereBufferGeometry(radius, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: zEntity.getMarkerColor(),
        wireframe: true,
      });
      const sphere = new THREE.Mesh(geometry, material);
      this.el.setObject3D('mesh', sphere);
    }
  },
});
