import BaseFS from './BaseFS';

class BrowserFS extends BaseFS {
  constructor() {
    super();
    this.files = [];
  }
}

export default BrowserFS;
