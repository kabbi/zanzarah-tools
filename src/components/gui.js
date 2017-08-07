import AFRAME from 'aframe/src';
import { GUI } from 'dat.gui/build/dat.gui';

AFRAME.registerComponent('gui', {
  schema: {
    name: { type: 'string' },
    lazy: { default: false },
    target: { type: 'selector' },
  },

  init() {
    const { lazy } = this.data;
    if (lazy) {
      return;
    }
    // Give other components some time to register event listeners
    setImmediate(() => {
      this.create();
    });
  },
  remove() {
    this.destroy();
  },

  create() {
    if (this.root) {
      return;
    }
    const { target, name } = this.data;
    if (target) {
      const { root: parent } = target.components.gui;
      this.root = parent.addFolder(name);
    } else {
      this.root = new GUI();
    }
    this.el.emit('gui-created', {
      gui: this.root,
    });
  },
  destroy() {
    if (!this.root) {
      return;
    }
    const { target } = this.data;
    this.el.emit('gui-destroyed', {
      gui: this.root,
    });
    if (target) {
      const { root: parent } = target.components.gui;
      parent.removeFolder(this.root);
    } else {
      this.root.destroy();
    }
    this.root = null;
  },
});
