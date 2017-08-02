import AFRAME from 'aframe/src';

import RemoteFS from 'utils/filesystems/RemoteFS';

AFRAME.registerComponent('fs-xhr', {
  dependencies: ['fs'],
  schema: {
    path: { type: 'string' },
  },

  init() {
    const { el: { components: { fs } } } = this;
    const { path } = this.data;
    this.fs = new RemoteFS(path);
    this.cleanup = fs.addFileSystem(this.remoteFS);
  },
  remove() {
    this.cleanup();
  },
});
