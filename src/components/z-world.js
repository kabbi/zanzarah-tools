import AFRAME from 'aframe/src';

import { bind } from 'utils/components';
import { CommonPaths } from 'utils/paths';

import { GuiMethods } from './gui-entity-editor';

AFRAME.registerComponent('z-world', {
  dependencies: ['z-entity'],
  schema: {
    fileName: { type: 'string' },
  },
  [GuiMethods]: [
    ['handleLoadModel', 'Load model'],
  ],

  init() {
    this.unbind = bind(
      this, 'handleWorldLoaded',
      this.el, 'model-loaded'
    );
  },
  remove() {
    this.unbind();
  },

  handleWorldLoaded() {
    const { components } = this.el;
    components['z-entity'].toggleMarker(false);
  },
  handleLoadModel() {
    const { fileName } = this.data;
    this.el.setAttribute('bsp-model', `${CommonPaths.Worlds}/${fileName.toUpperCase()}.BSP`);
  },
});
