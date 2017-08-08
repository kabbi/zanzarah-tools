import AFRAME from 'aframe/src';

import { bind } from 'utils/components';

AFRAME.registerComponent('attach-to-bone', {
  schema: { type: 'number' },

  init() {
    this.unbind = bind(this, 'handleModelLoaded', this.el.parentNode, 'model-loaded');
  },
  remove() {
    this.unbind();
  },

  handleModelLoaded(event) {
    const { model } = event.detail;
    this.el.parentNode.object3D.remove(this.el.object3D);
    model.skeleton.bones[this.data].add(this.el.object3D);
  },
});
