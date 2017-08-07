import AFRAME, { THREE } from 'aframe/src';

import { bind, callLater } from '../utils/components';
import { CommonPaths } from '../utils/paths';

import { GuiMethods } from './gui-entity-editor';

AFRAME.registerComponent('z-model', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    scale: { type: 'array' },
    fileName: { type: 'string' },
    _unknownColor: { type: 'string' },
    _unknownFlag1: { type: 'number' },
    _unknownFlag2: { type: 'number' },
    _unknownInt: { type: 'number' },
  },
  [GuiMethods]: [
    ['handleLoadModel', 'Load model'],
  ],

  init() {
    this.unbind = callLater(
      bind(this, 'handleModelLoaded', this.el, 'model-loaded'),
      bind(this, 'handleComponentChanged', this.el, 'componentchanged'),
    );
  },
  update() {
    const { object3D } = this.el;
    const { position, rotation } = this.data;
    object3D.position.fromArray(position);
    object3D.rotation.y = Math.atan2(rotation[0], rotation[2]);
  },
  remove() {
    this.unbind();
  },

  handleModelLoaded() {
    const { components } = this.el;
    components['z-entity'].toggleMarker(false);
  },
  handleLoadModel() {
    const { fileName } = this.data;
    this.el.setAttribute('dff-model', {
      dff: `${CommonPaths.StaticModels}/${fileName.toUpperCase()}.DFF`,
    });
  },
  handleComponentChanged(event) {
    const { name, newData } = event.detail;
    if (name === 'position') {
      const { x, y, z } = newData;
      this.el.setAttribute(this.attrName, 'position', [x, y, z]);
    }
    if (name === 'rotation') {
      const { y } = newData;
      const { rotation: oldRotation } = this.data;
      this.el.setAttribute(this.attrName, 'rotation', [
        Math.sin(THREE.Math.degToRad(y)), oldRotation[1],
        Math.cos(THREE.Math.degToRad(y)),
      ]);
    }
  },
});
