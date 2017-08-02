/* eslint-disable no-unused-vars */

const notImplemented = method => {
  throw new Error(`Not implemented: FS.${method}`);
};

class BaseFS {
  async load(url, type) {
    notImplemented('load');
  }
  async save(url, type, data) {
    notImplemented('save');
  }
  async index(url, deep) {
    notImplemented('index');
  }
  async exists(url) {
    notImplemented('exists');
  }
}

export default BaseFS;
