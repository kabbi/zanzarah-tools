import { extname } from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';

// eslint-disable-next-line import/no-extraneous-dependencies
import 'three/examples/js/loaders/DDSLoader';

const warn = debug('app:vr:components:load:warn');

AFRAME.registerComponent('load', {
  schema: {
    url: { type: 'asset' },
  },

  init() {
    const { url } = this.data;
    const method = `handle${extname(url).slice(1).toUpperCase()}`;
    if (!this[method]) {
      warn('Unsupported file type: %s', url);
      return;
    }
    this[method](url);
  },

  handleDDS(url) {
    const loader = new THREE.DDSLoader();
    this.el.setAttribute('material', {
      color: 'white',
      shader: 'flat',
    });
    this.el.setAttribute('geometry', {
      primitive: 'plane',
      width: 2 * 10 * 5.67128181961771,
      height: 2 * 10 * 5.67128181961771,
    });
    loader.load(url, texture => {
      const plane = this.el.getObject3D('mesh');
      plane.material.map = texture;
      plane.material.needsUpdate = true;
    });
  },
});
