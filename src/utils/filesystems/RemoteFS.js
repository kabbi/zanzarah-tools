import get from 'lodash/get';
import mapValues from 'lodash/mapValues';

import BaseFS from './BaseFS';

const TypeMappings = {
  arraybuffer: 'arrayBuffer',
  formdata: 'formData',
  blob: 'blob',
  json: 'json',
  text: 'text',
};

class RemoteFS extends BaseFS {
  constructor(basePath) {
    super();
    this.basePath = basePath;
    this.fullIndexCache = null;
  }

  async index(url = '/', deep) {
    if (!this.fullIndexCache) {
      this.fullIndexCache = await this.load('', 'json');
    }
    const childIndex = url === '/' ? this.fullIndexCache : (
      get(this.fullIndexCache, url.split('/'))
    );
    return deep ? childIndex : mapValues(childIndex, entry => (
      entry && {}
    ));
  }

  async load(url, type) {
    const targetUrl = `${this.basePath}${url}`;
    if (type === 'url') {
      return targetUrl;
    }
    if (!TypeMappings[type]) {
      throw new Error(`Unsupported response type: ${type}`);
    }
    const result = await fetch(targetUrl);
    return result[TypeMappings[type]]();
  }

  async exists(url, type) {
    const result = await fetch(`${this.basePath}${url}`);
    return result[type]();
  }
}

export default RemoteFS;
