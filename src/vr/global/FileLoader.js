import { THREE } from 'aframe/src';
import fs from 'utils/fs';

/**
 * What we do here is monkey-patch the original FileLoader, so that it would
 * pass all the requests to our fs system, which will resolve it using several
 * registered file systems instead (and do many other cool things)
 */

const { FileLoader } = THREE;
FileLoader.prototype._originalLoad = FileLoader.prototype.load;
FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  fs.load(url, this.responseType).then(onLoad, onError);
};
