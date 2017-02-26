import AFRAME from 'aframe/src';
import { GUI } from 'dat.gui/build/dat.gui';

AFRAME.registerComponent('gui', {
  init() {
    this.root = new GUI();
  },
});
