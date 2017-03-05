import AFRAME, { THREE } from 'aframe/src';

AFRAME.registerComponent('orbit-controls', {
  dependencies: ['camera', 'position'],
  init() {
    this.el.getObject3D('camera').position.x = 10;
    this.el.sceneEl.addEventListener('render-target-loaded', () => {
      this.controls = new THREE.OrbitControls(
        this.el.getObject3D('camera'),
        this.el.sceneEl.canvas
      );
      this.controls.enabled = this.isPlaying;
    }, {
      once: true,
    });
  },
  play() {
    if (!this.controls) {
      return;
    }
    this.controls.enabled = true;
  },
  pause() {
    if (!this.controls) {
      return;
    }
    this.controls.enabled = false;
  },
  remove() {
    if (!this.controls) {
      return;
    }
    this.controls.dispose();
  },
});
