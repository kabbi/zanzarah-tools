import { THREE } from 'aframe/src';
import debug from 'debug';

const warn = debug('app:vr:three:XHRLoader:warn');

/**
 * What we do here is monkey-patch the original XHRLoader, so that it would
 * pass all the requests to our fs system, which will resolve it using several
 * registered file systems instead
 */

const { XHRLoader } = THREE;
XHRLoader.prototype._originalLoad = XHRLoader.prototype.load;
XHRLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const scene = document.querySelector('a-scene');
  if (!scene || !scene.systems.fs) {
    warn('No aframe scene or fs system found, falling back to xhr load');
    return this._originalLoad(url, onLoad, onProgress, onError);
  }

  const { systems: { fs } } = scene;
  const options = {
    url,
    path: this.path,
    responseType: this.responseType,
    withCredentials: this.withCredentials,
  };
  fs.load(options, onLoad, onProgress, onError);
};
