import AFRAME from 'aframe/src';

import { readFile } from 'utils/files';

AFRAME.registerComponent('fs-browser', {
  schema: {
    openOnDrop: { default: true },
  },

  init() {
    const { el: { components: { fs } } } = this;

    this.roots = [];
    const component = this;

    this.cleanup = fs.registerFileSystem({
      id: 'browser',
      entity: component,
      async load(options, onLoad, onProgress, onError) {
        const { url, responseType = 'text' } = options;
        const entry = await component.findFile(url);
        if (entry) {
          const file = await new Promise((resolve, reject) => {
            entry.file(resolve, reject);
          });
          readFile(file, responseType)
            .then(onLoad, onError);
          return;
        }
        if (onError) {
          onError(new Error(`File not found: ${url}`));
        }
      },
      async index() {
        const files = [];
        for (const root of component.roots) {
          await component.listAllFiles(root, files);
        }
        return files;
      },
      async includes({ url }) {
        return Boolean(await component.findFile(url));
      },
    });
  },

  async listAllFiles(directory, result) {
    const entries = await new Promise((resolve, reject) => {
      directory.createReader().readEntries(resolve, reject);
    });
    for (const entry of entries) {
      if (entry.isFile) {
        result.push(entry.fullPath.slice(1));
      }
      if (entry.isDirectory) {
        await this.listAllFiles(entry, result);
      }
    }
  },
  async findFile(url) {
    for (const directory of this.roots) {
      try {
        return await new Promise((resolve, reject) => {
          directory.getFile(url, {}, resolve, reject);
        });
      } catch (err) {
        continue;
      }
    }
    return null;
  },

  addRoot(root) {
    this.roots.push(root);
    this.el.emit('fs-updated', {
      id: 'browser',
    });
  },
  reset() {
    this.roots = [];
    this.el.emit('fs-updated', {
      id: 'browser',
    });
  },

  remove() {
    this.cleanup();
  },
});
