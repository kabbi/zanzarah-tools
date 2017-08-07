import AFRAME, { THREE } from 'aframe/src';

import { getRootPath } from '../utils/paths';

AFRAME.registerComponent('ska-animation', {
  multiple: true,
  schema: { type: 'asset' },

  init() {
    this.model = null;
    this.skaLoader = new THREE.SKALoader();
    this.skaLoader.setPath(getRootPath());
  },

  update() {
    if (!this.data) {
      return;
    }
    this.remove();
    this.load(this.data);
  },

  remove() {
    // FIXME
  },

  load(skaUrl) {
    this.skaLoader.setName(this.id);
    this.skaLoader.load(skaUrl, clip => {
      // TODO: `added`, `removed` states instead of `loaded` one
      this.el.emit('animation-loaded', { clip });
    });
  },
});
