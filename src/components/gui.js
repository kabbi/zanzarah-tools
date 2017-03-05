import AFRAME from 'aframe/src';
import { GUI } from 'dat.gui/build/dat.gui';

AFRAME.registerComponent('gui', {
  schema: {
    lazy: { default: false },
  },

  init() {
    const { lazy } = this.data;
    if (!lazy) {
      this.create();
    }
  },
  remove() {
    this.destroy();
  },

  create() {
    if (this.root) {
      return;
    }
    this.root = new GUI();
    this.el.emit('gui-created', {
      gui: this.root,
    });
  },
  destroy() {
    if (!this.root) {
      return;
    }
    this.el.emit('gui-destroyed', {
      gui: this.root,
    });
    this.root.destroy();
    this.root = null;
  },
});
