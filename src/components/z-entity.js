import AFRAME, { THREE } from 'aframe/src';

const MarkerColors = {
  origin: 'blue',
  world: 'orange',
  model_v3: 'red',
};

const MarkerSizes = {
  world: 2,
};

AFRAME.registerComponent('z-entity', {
  schema: {
    id: { type: 'string' },
    type: { type: 'string' },
    singleton: { default: false },
  },

  init() {
    const { type } = this.data;
    this.marker = this.el.getOrCreateObject3D('marker', THREE.Mesh);
    this.marker.material.color = new THREE.Color(MarkerColors[type] || 'black');
    this.marker.material.wireframe = true;
    this.marker.geometry = new THREE.SphereBufferGeometry(
      MarkerSizes[type] || 1, 4, 2
    );
  },
  remove() {
    this.el.removeObject3D('marker');
  },

  toggleMarker(visible) {
    this.el.getObject3D('marker').visible = visible;
  },
});
