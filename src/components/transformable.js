import AFRAME, { THREE } from 'aframe/src';

import { bind, callLater } from '../utils/components';

const Modes = ['translate', 'rotate', 'scale'];
const DoubleClickInterval = 200;

AFRAME.registerComponent('transformable', {
  init() {
    this.unbind = callLater(
      bind(this, 'handleChangeMode', this.el, 'click'),
      bind(this, 'handleCreateControls', this.el, 'stateadded'),
      bind(this, 'handleDestroyControls', this.el, 'stateremoved'),
    );
  },
  tick() {
    if (this.controls) {
      this.controls.update();
    }
  },
  remove() {
    const { sceneEl: { object3D } } = this.el;
    if (this.controls) {
      this.controls.detach();
      object3D.remove(this.controls);
    }
    this.unbind();
  },

  handleCreateControls(event) {
    const { detail: { state } } = event;
    if (state !== 'selected' || this.controls) {
      return;
    }
    const { sceneEl } = this.el;
    this.controls = new THREE.TransformControls(
      sceneEl.camera, sceneEl.renderer.domElement
    );
    this.controls.setMode(Modes[0]);
    this.controls.attach(this.el.object3D);
    sceneEl.object3D.add(this.controls);
  },
  handleDestroyControls(event) {
    const { detail: { state } } = event;
    if (state !== 'selected' || !this.controls) {
      return;
    }
    this.controls.detach();
    const { sceneEl: { object3D } } = this.el;
    object3D.remove(this.controls);
    this.controls = null;
  },
  handleChangeMode() {
    if (!this.controls) {
      return;
    }
    if (Date.now() - this.prevClickTime < DoubleClickInterval) {
      const nextModeIndex = Modes.indexOf(this.controls.getMode()) + 1;
      this.controls.setMode(Modes[nextModeIndex % Modes.length]);
    }
    this.prevClickTime = Date.now();
  },
});
