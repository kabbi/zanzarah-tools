import AFRAME from 'aframe/src';

AFRAME.registerComponent('fs-zip', {
  schema: {
    openOnDrop: { default: true },
  },

  init() {
    const { el: { components: { fs } } } = this;

    this.archives = [];
    const component = this;

    this.cleanup = fs.registerFileSystem({
      id: 'zip',
      entity: component,
      async load(options, onLoad, onProgress, onError) {
        const { url, responseType = 'text' } = options;
        for (const archive of component.archives) {
          const zip = await archive;
          const file = zip.file(url);
          if (file) {
            file.async(responseType)
              .then(onLoad, onError);
            return;
          }
        }
        if (onError) {
          onError(new Error(`File not found: ${url}`));
        }
      },
      async index() {
        const files = [];
        for (const archive of component.archives) {
          const zip = await archive;
          zip.forEach(relativePath => {
            files.push(relativePath);
          });
        }
        return files;
      },
      async includes({ url }) {
        for (const archive of component.archives) {
          const zip = await archive;
          if (zip.file(url)) {
            return true;
          }
        }
        return false;
      },
    });
  },

  addArchive(zip) {
    this.archives.push(zip);
    this.el.emit('fs-updated', {
      id: 'zip',
    });
  },
  reset() {
    this.archives = [];
    this.el.emit('fs-updated', {
      id: 'zip',
    });
  },

  remove() {
    this.cleanup();
  },
});
