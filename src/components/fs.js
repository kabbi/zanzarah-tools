import AFRAME from 'aframe/src';

AFRAME.registerComponent('fs', {
  init() {
    const { el: { sceneEl } } = this;
    const { systems: { fs } } = sceneEl;
    this.fs = fs;
  },

  registerFileSystem(fs) {
    this.fs.fileSystems.push(fs);
    return () => {
      const index = this.fileSystems.indexOf(fs);
      if (index === -1) {
        return;
      }
      this.fs.fileSystems.splice(index, 1);
    };
  },
  getFilesystemById(id) {
    return this.fs.fileSystems.find(fs => (
      fs.id === id
    ));
  },
});
