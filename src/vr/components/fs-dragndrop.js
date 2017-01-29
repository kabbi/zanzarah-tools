import path from 'path';
import AFRAME from 'aframe/src';
import debug from 'debug';
import JSZip from 'jszip';

import { readFile } from '../../utils/files';

const info = debug('app:vr:components:fs-dragndrop:info');

AFRAME.registerComponent('fs-dragndrop', {
  init() {
    const { el: { sceneEl } } = this;
    const { systems: { fs }, canvas } = sceneEl;

    this.files = [];
    this.archives = [];
    const component = this;

    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    canvas.addEventListener('dragover', this.handleDragOver);
    canvas.addEventListener('drop', this.handleDrop);

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
    this.files = Array.from(files);
    this.archives = this.files.filter(file => (
      path.extname(file.name) === '.zip'
    )).map(file => (
      readFile(file, 'arraybuffer').then(data => {
        const zip = new JSZip();
        return zip.loadAsync(data);
      })
    ));
    this.el.emit('changed');
  },

  remove() {
    const { el: { sceneEl: { canvas } } } = this;
    canvas.removeEventListener('dragover', this.handleDragOver);
    canvas.removeEventListener('drop', this.handleDrop);
    this.cleanup();
  },
});
