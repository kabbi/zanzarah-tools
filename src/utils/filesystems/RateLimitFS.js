import Bottleneck from 'bottleneck';

import BaseFS from './BaseFS';

class RateLimitFS extends BaseFS {
  constructor(parent, limit = 5, pause = 0) {
    super();
    this.parent = parent;
    this.limiter = new Bottleneck(limit, pause);
  }

  load(...args) {
    return this.limiter.schedule(() => (
      this.parent.load(...args)
    ));
  }
  index(...args) {
    return this.parent.index(...args);
  }
  exists(...args) {
    return this.parent.exists(...args);
  }
}

export default RateLimitFS;
