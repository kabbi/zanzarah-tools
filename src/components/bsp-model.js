import AFRAME, { THREE } from 'aframe/src';

import { getRootPath } from 'utils/paths';

AFRAME.registerComponent('bsp-model', {
  dependencies: ['material'],

  schema: {type: 'model'},

  init() {
    this.model = null;
    this.bspLoader = new THREE.BSPLoader();
    this.bspLoader.setPath(getRootPath());
  },

  update() {
    if (!this.data) {
      return;
    }
    this.remove();
    this.loadObj(this.data);
  },

  remove() {
    if (!this.model) {
      return;
    }
    this.el.removeObject3D('mesh');
  },

  loadObj(bspUrl) {
    const el = this.el;
    const bspLoader = this.bspLoader;

    bspLoader.load(bspUrl, (bspModel, meta) => {
      this.model = bspModel;
      el.setObject3D('mesh', bspModel);
      el.emit('model-loaded', {
        format: 'bsp',
        model: bspModel,
        meta,
      });
    });
  },
});
