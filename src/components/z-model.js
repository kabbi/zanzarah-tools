import AFRAME from 'aframe/src';

import { bind } from '../utils/components';
import { CommonPaths } from '../utils/paths';

AFRAME.registerComponent('z-model', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    scale: { type: 'array' },
    fileName: { type: 'string' },
    _unknownColor: { type: 'number' },
    _unknownFlag1: { type: 'number' },
    _unknownFlag2: { type: 'number' },
    _unknownInt: { type: 'number' },
  },

  init() {
    this.unbind = bind(
      this, 'handleModelLoaded',
      this.el, 'model-loaded'
    );
    const { fileName, position, scale } = this.data;
    this.el.setAttribute('position', position.join(' '));
    this.el.setAttribute('scale', scale.join(' '));
    this.el.setAttribute('dff-model', {
      dff: `${CommonPaths.StaticModels}/${fileName.toUpperCase()}.DFF`,
    });
  },
  remove() {
    this.el.removeAttribute('dff-model');
    this.unbind();
  },

  handleModelLoaded() {
    const { components } = this.el;
    components['z-entity'].toggleMarker(false);
  },
});
