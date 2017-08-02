import AFRAME from 'aframe/src';

import CompositeFS from 'utils/filesystems/CompositeFS';

AFRAME.registerSystem('fs', {
  init() {
    this.current = new CompositeFS();
  },
});
