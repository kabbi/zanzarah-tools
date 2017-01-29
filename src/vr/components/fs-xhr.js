import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';
import keyBy from 'lodash/keyBy';

import { fetchJson } from '../../utils/remote';

const info = debug('app:vr:components:fs-xhr:info');

AFRAME.registerComponent('fs-xhr', {
  schema: {
    path: { type: 'string' },
    indexPath: { default: '' },
  },

  init() {
    const { el: { sceneEl } } = this;
    const { systems: { fs } } = sceneEl;
    const { path, indexPath } = this.data;

    let indexPromise = null;
    const loader = new THREE.XHRLoader();
    loader.setPath(path);

    const fetchIndex = () => {
      info('Fetching index for the first time');
      return fetchJson(`${path}${indexPath}`).then(index => ({
        indexMap: keyBy(index),
        index,
      }));
    };

    this.cleanup = fs.registerFileSystem({
      id: 'xhr',
      load(options, onLoad, onProgress, onError) {
        const { url, responseType } = options;
        loader.setResponseType(responseType);
        loader._originalLoad(url, onLoad, onProgress, onError);
      },
      async index() {
        indexPromise = indexPromise || fetchIndex();
        const { index } = await indexPromise;
        return index;
      },
      async includes({ url }) {
        indexPromise = indexPromise || fetchIndex();
        const { indexMap } = await indexPromise;
        return indexMap[url];
      },
    });
  },
  remove() {
    this.cleanup();
  },
});
