import AFRAME, { THREE } from 'aframe/src';

import { getRootPath } from 'utils/paths';

AFRAME.registerComponent('dff-model', {
  dependencies: ['material'],

  schema: {
    dff: {type: 'model'},
  },

  init() {
    this.model = null;
    this.dffLoader = new THREE.DFFLoader();
    this.dffLoader.setPath(getRootPath());
  },

  update() {
    const { data } = this;
    if (!data.dff) {
      return;
    }
    this.remove();
    this.loadObj(data.dff);
  },

  remove() {
    if (!this.model) {
      return;
    }
    this.el.removeObject3D('mesh');
  },

  loadObj(dffUrl) {
    const el = this.el;
    const dffLoader = this.dffLoader;

    dffLoader.load(dffUrl, dffModel => {
      this.model = dffModel;
      el.setObject3D('mesh', dffModel);
      el.emit('model-loaded', {format: 'dff', model: dffModel});
    });
  },
});
