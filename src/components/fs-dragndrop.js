import path from 'path';
import AFRAME from 'aframe/src';
import debug from 'debug';
import JSZip from 'jszip';

import { readFile } from 'utils/files';

const info = debug('app:components:fs-dragndrop:info');

AFRAME.registerComponent('fs-dragndrop', {
  schema: {
    openOnDrop: { default: true },
  },

  init() {
    const { el: { components: { fs } } } = this;

    this.files = [];
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
        if (onError) {
          onError(new Error(`File not found: ${url}`));
        }
      },
      async index() {
        return component.files.map(file => file.name);
      },
      async includes({ url }) {
        return component.files.some(file => file.name === url);
      },
    });
  },

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  },

  handleDrop(event) {
    event.preventDefault();
    const { components } = this.el;
    const zipFS = components['fs-zip'];
    const browserFS = components['fs-browser'];
    const { dataTransfer } = event;
    const items = Array.from(dataTransfer.items);
    info('Updating file list %o', items);
    const newFiles = [];
    for (const item of items) {
      const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
      if (browserFS && entry && entry.isDirectory) {
        browserFS.addRoot(entry);
        continue;
      }
      const file = item.getAsFile();
      if (zipFS && path.extname(file.name) === '.zip') {
        zipFS.addArchive(readFile(file, 'arraybuffer')
          .then(data => new JSZip().loadAsync(data)));
        continue;
      }
      this.files.push(file);
      newFiles.push(file);
    }
    this.el.emit('fs-updated', {
      id: 'dnd',
    });
    if (this.data.openOnDrop && newFiles.length === 1) {
      this.el.emit('file-selected', {
        fileName: newFiles[0].name,
      });
    }
  },

  reset() {
    this.files = [];
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
