import AFRAME, { THREE } from 'aframe/src';

import { getRootPath } from '../../utils/paths';

AFRAME.registerComponent('bsp-model', {
  dependencies: ['material'],

  schema: {
    bsp: {type: 'model'},
  },

  init() {
    this.model = null;
    this.bspLoader = new THREE.BSPLoader();
    this.bspLoader.setPath(getRootPath());
  },

  update() {
    const { data } = this;
    if (!data.bsp) {
      return;
    }
    this.remove();
    this.loadObj(data.bsp);
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
      const [ x, y, z ] = meta.origin;
      el.setAttribute('position', `${x} ${y} ${z}`);
      el.setObject3D('mesh', bspModel);
      el.emit('model-loaded', {format: 'bsp', model: bspModel});
    });
  },
});
