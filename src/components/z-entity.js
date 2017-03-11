import AFRAME, { THREE } from 'aframe/src';

const MarkerColors = {
  origin: 'blue',
  world: 'orange',
  light: 'white',
  trigger: 0x6929a5,
  dynamic_model: 'green',
  model_v3: 'red',
  fo_model_v4: 'yellow',
};

const MarkerSizes = {
  world: 2,
  light: 0.5,
};

AFRAME.registerComponent('z-entity', {
  schema: {
    type: { type: 'string' },
    singleton: { default: false },
  },

  init() {
    this.createMarker();
    this.createArrow();
  },
  remove() {
    this.el.removeObject3D('marker');
  },

  createMarker() {
    const { type } = this.data;
    this.marker = this.el.getOrCreateObject3D('marker', THREE.Mesh);
    this.marker.material.color = new THREE.Color(MarkerColors[type] || 'black');
    this.marker.material.wireframe = true;
    this.marker.geometry = new THREE.SphereBufferGeometry(
      MarkerSizes[type] || 1, 4, 2
    );
  },
  createArrow() {
    const { type } = this.data;
    this.arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      (MarkerSizes[type] || 1) * 2,
      this.getMarkerColor()
    );
    this.arrow.cone.material.wireframe = true;
    this.el.setObject3D('arrow', this.arrow);
  },

  getMarkerColor() {
    return this.marker.material.color;
  },
  setMarkerScale(value) {
    this.marker.scale.set(value, value, value);
  },
  toggleMarker(visible) {
    this.marker.visible = visible;
    this.arrow.visible = visible;
  },
});
