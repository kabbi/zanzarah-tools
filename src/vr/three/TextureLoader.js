import { THREE } from 'aframe/src';
import debug from 'debug';

const warn = debug('app:vr:three:TextureLoader:warn');

/**
 * We patch texture loader so it would save source file name into texture,
 * for us to be able to persist original texture file name when exporting models.
 */

const { TextureLoader } = THREE;
TextureLoader.prototype._originalLoad = TextureLoader.prototype.load;
TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const texture = this._originalLoad(url, onLoad, onProgress, onError);
  texture.sourceFile = url;
  return texture;
};
