import AFRAME from 'aframe/src';
import _debug from 'debug';

const verbose = _debug('app:systems:fs:verbose');
const error = _debug('app:systems:fs:error');

AFRAME.registerSystem('fs', {
  schema: {},

  init() {
    this.fileSystems = [];
  },

  async load(options, onLoad, onProgress, onError) {
    for (const fs of this.fileSystems) {
      const hasFile = await fs.includes(options);
      if (!hasFile) {
        continue;
      }
      verbose('Using fs %s to fulfil the request %o', fs.id, options);
      return fs.load(options, onLoad, onProgress, onError);
    }
    error('File not found %s', options.url);
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
