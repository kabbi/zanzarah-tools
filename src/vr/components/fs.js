import AFRAME from 'aframe/src';

AFRAME.registerComponent('fs', {
  init() {
    const { el: { sceneEl } } = this;
    const { systems: { fs } } = sceneEl;
    this.fsSystem = fs;
  },

  addFileSystem(fs) {
    return this.fsSystem.current.add(fs);
  },
});
