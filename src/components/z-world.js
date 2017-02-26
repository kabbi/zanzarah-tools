import AFRAME from 'aframe/src';

import { bind } from '../utils/components';
import { CommonPaths } from '../utils/paths';

AFRAME.registerComponent('z-world', {
  dependencies: ['z-entity'],
  schema: {
    fileName: { type: 'string' },
  },

  init() {
    this.unbind = bind(
      this, 'handleWorldLoaded',
      this.el, 'model-loaded'
    );
    const { fileName } = this.data;
    this.el.setAttribute('bsp-model', {
      bsp: `${CommonPaths.Worlds}/${fileName.toUpperCase()}.BSP`,
    });
  },
  remove() {
    this.el.removeAttribute('bsp-model');
    this.unbind();
  },

  handleWorldLoaded() {
    const { components } = this.el;
    components['z-entity'].toggleMarker(false);
  },
});
