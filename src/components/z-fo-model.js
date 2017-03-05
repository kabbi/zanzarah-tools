import AFRAME from 'aframe/src';

import { bind } from '../utils/components';
import { CommonPaths } from '../utils/paths';

AFRAME.registerComponent('z-fo-model', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    fileName: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    _unknownFloats: { type: 'string' },
    scale: { type: 'array' },
    _unknownColor: { type: 'color' },
    _unknownFlags: { type: 'array' },
    _unknownInt1: { type: 'number' },
    _unknownFlag: { type: 'number' },
    _unknownInt2: { type: 'number' },
  },

  init() {
    this.unbind = bind(
      this, 'handleModelLoaded',
      this.el, 'model-loaded'
    );
    const { object3D } = this.el;
    const { fileName, position, rotation } = this.data;
    object3D.position.fromArray(position);
    object3D.rotation.y = Math.atan2(rotation[0], rotation[2]);
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
