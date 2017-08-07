import { THREE } from 'aframe/src';

/**
 * We patch image loader to use FileLoader, so that all the image data requests
 * would go through our internal fs subsystem
 */

THREE.ImageLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
  image.onerror = onError;
  image.onload = () => {
    image.onload = null;
    URL.revokeObjectURL(image.src);
    if (onLoad) {
      onLoad(image);
    }
    this.manager.itemEnd(url);
  };

  if (url.indexOf('data:') === 0) {
    image.src = url;
  } else {
    const loader = new THREE.FileLoader();
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.setWithCredentials(this.withCredentials);

    // By default the FileLoader requests files to be loaded with a MIME
    // type of `text/plain`. Using `URL.createObjectURL()` with SVGs that
    // have a MIME type of `text/plain` results in an error, so explicitly
    // set the SVG MIME type.
    if (/\.svg$/.test(url)) {
      loader.setMimeType('image/svg+xml');
    }

    loader.load(url, blob => {
      image.src = URL.createObjectURL(blob);
    }, onProgress, onError);
  }

  this.manager.itemStart(url);

  return image;
};
