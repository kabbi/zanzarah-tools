import AFRAME from 'aframe/src';

AFRAME.registerComponent('selectable', {
  init() {
    this.unregister = this.system.register(this.el);
  },
  remove() {
    this.unregister();
  },
});
