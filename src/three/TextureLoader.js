import { THREE } from 'aframe/src';

/**
 * We patch texture loader to be able to persist original texture file name so
 * that we would be able to re-export it with our models if necessary
 */

const { TextureLoader } = THREE;
TextureLoader.prototype._originalLoad = TextureLoader.prototype.load;
TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const texture = this._originalLoad(url, onLoad, onProgress, onError);
  texture.sourceFile = url;
  return texture;
};
