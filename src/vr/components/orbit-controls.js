import AFRAME, { THREE } from 'aframe/src';

AFRAME.registerComponent('orbit-controls', {
  dependencies: ['camera', 'position'],
  init() {
    this.el.getObject3D('camera').position.x = 10;
    this.controls = new THREE.OrbitControls(
      this.el.getObject3D('camera'),
      // >TODO: Use renderer.domElement here
      document.getElementById('root')
    );
    this.controls.enabled = false;
  },
  play() {
    this.controls.enabled = true;
  },
  pause() {
    this.controls.enabled = false;
  },
  remove() {
    this.controls.dispose();
  },
});
