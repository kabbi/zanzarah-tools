import AFRAME from 'aframe/src';
import _debug from 'debug';

const info = _debug('app:vr:systems:fs:info');

AFRAME.registerSystem('fs', {
  schema: {},

  init() {
    this.fileSystems = [];
  },

  registerFileSystem(fs) {
    this.fileSystems.push(fs);
    return () => {
      const index = this.fileSystems.indexOf(fs);
      if (index === -1) {
        return;
      }
      this.fileSystems.splice(index, 1);
    };
  },
  getFilesystemById(id) {
    return this.fileSystems.find(fs => (
      fs.id === id
    ));
  },
  async load(options, onLoad, onProgress, onError) {
    for (const fs of this.fileSystems) {
      const hasFile = await fs.includes(options);
      if (!hasFile) {
        continue;
      }
      info('Using fs %s to fulfil the request %o', fs.id, options);
      return fs.load(options, onLoad, onProgress, onError);
    }
    info('File not found %s', options.url);
    if (onError) {
      onError(new Error(`File not found: ${options.url}`));
    }
  },
  async index() {
    const allFiles = [];
    for (const fs of this.fileSystems) {
      allFiles.push(...await fs.index());
    }
    return allFiles;
  },
});
