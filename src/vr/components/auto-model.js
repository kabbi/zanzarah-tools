import path from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';

import { CommonPaths, getRootPath } from '../../utils/paths';
import { readFile } from '../../utils/files';

const warn = debug('app:vr:components:auto-model:warn');

AFRAME.registerComponent('auto-model', {
  schema: {
    files: { type: 'array', default: [] },
  },

  update() {
    const { el, data: { files } } = this;
    if (el.getObject3D('model')) {
      el.removeObject3D('model');
    }
    if (files.length === 0) {
      return;
    }
    for (const file of files) {
      const ext = path.extname(file.name).slice(1);
      const method = `handle${ext.toUpperCase()}`;
      if (this[method]) {
        this[method](file, files);
      } else {
        warn('Unsupported file format', ext, file);
      }
    }
  },
  remove() {
    this.el.removeObject3D('model');
  },

  async handleOBJ(file, files) {
    const { el } = this;
    const data = await readFile(file, 'text');
    const objLoader = new THREE.OBJLoader();

    const fileName = path.basename(file.name, '.obj');
    const mtlFile = files.find(f => (
      path.basename(f.name, '.mtl') === fileName
    ));

    if (mtlFile) {
      const mtlData = await readFile(mtlFile, 'text');
      const mtlLoader = new THREE.MTLLoader();
      // mtlLoader.setBaseUrl(mtlUrl.substr(0, mtlUrl.lastIndexOf('/') + 1));
      const materials = mtlLoader.parse(mtlData);
      materials.preload();
      objLoader.setMaterials(materials);
    }

    const model = objLoader.parse(data);

    el.setObject3D('model', model);
    el.emit('model-loaded', {format: 'obj', model });
  },
  async handleMTL(file, files) {
    const fileName = path.basename(file.name, '.mtl');
    const objFile = files.find(f => (
      path.basename(f.name, '.obj') === fileName
    ));

    if (!objFile) {
      warn('No corresponding obj file found for %s', file.name);
    }
  },

  async handleDFF(file) {
    const { el } = this;
    const data = await readFile(file, 'blob');
    const loader = new THREE.DFFLoader();
    loader.setPath(getRootPath());
    const model = await loader.loadBlob(data,
      // Provide fake file url here to allow proper texture loading
      `/${CommonPaths.StaticModels}/DUMMY.DFF`
    );
    el.setObject3D('model', model);
    el.emit('model-loaded', {format: 'dff', model });
  },
});
