import path from 'path';
import AFRAME from 'aframe/src';
import debug from 'debug';
import JSZip from 'jszip';

import { readFile } from 'utils/files';

const info = debug('app:vr:components:fs-dragndrop:info');

AFRAME.registerComponent('fs-dragndrop', {
  schema: {
    openOnDrop: { default: true },
  },

  init() {
    const { el: { components: { fs } } } = this;

    this.files = [];
    this.archives = [];
    const component = this;

    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    document.addEventListener('dragover', this.handleDragOver);
    document.addEventListener('drop', this.handleDrop);

    this.cleanup = fs.registerFileSystem({
      id: 'dnd',
      entity: component,
      async load(options, onLoad, onProgress, onError) {
        const { url, responseType = 'text' } = options;
        const file = component.files.find(file => (
          file.name === url
        ));
        if (file) {
          readFile(file, responseType)
            .then(onLoad, onError);
          return;
        }
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
        files.push(...component.files.filter(file => (
          path.extname(file.name) !== '.zip'
        )).map(file => (
          file.name
        )));
        for (const archive of component.archives) {
          const zipFiles = [];
          const zip = await archive;
          zip.forEach(relativePath => {
            zipFiles.push(relativePath);
          });
          files.push(...zipFiles);
        }
        return files;
      },
      async includes({ url }) {
        if (component.files.some(file => file.name === url)) {
          return true;
        }
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

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  },

  handleDrop(event) {
    event.preventDefault();
    const { dataTransfer: { files } } = event;
    info('Updating file list %o', files);
    // It's originally FileList instance
    const filesArray = Array.from(files);
    this.files.push(...filesArray);
    this.archives.push(...filesArray.filter(file => (
      path.extname(file.name) === '.zip'
    )).map(file => (
      readFile(file, 'arraybuffer').then(data => {
        const zip = new JSZip();
        return zip.loadAsync(data);
      })
    )));
    this.el.emit('fs-updated', {
      id: 'dnd',
      newfiles: filesArray,
    });
    const { openOnDrop } = this.data;
    if (openOnDrop && filesArray.length === 1) {
      const fileName = filesArray[0].name;
      this.el.emit('file-selected', { fileName });
    }
  },

  reset() {
    this.files = [];
    this.archives = [];
    this.el.emit('fs-updated', {
      id: 'dnd',
    });
  },

  remove() {
    document.removeEventListener('dragover', this.handleDragOver);
    document.removeEventListener('drop', this.handleDrop);
    this.cleanup();
  },
});
