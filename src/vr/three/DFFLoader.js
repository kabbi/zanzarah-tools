import { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { resolveTexturePath } from '../../utils/remote';
import { typeSet } from '../../parsers/renderware';
import './RenderwareLoader';

const info = debug('app:vr:three:DFFLoader:info');

THREE.DFFLoader = class DFFLoader extends THREE.RenderwareLoader {
  constructor(manager) {
    super();
    this.manager = manager || THREE.DefaultLoadingManager;
    this.materials = null;
  }

  load(url, onLoad, onProgress, onError) {
    info('Loading data %s', url);
    const loader = new THREE.XHRLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.load(url, blob => {
      info('Loaded data from %s, %d bytes', url, blob.size);
      jBinary.load(blob, typeSet).then(binary => {
        onLoad(this.parse(binary.readAll(), url));
      }).catch(err => {
        info('Fatal error', err);
        if (onError) {
          onError(err);
        }
      });
    }, onProgress, onError);
  }

  loadBlob(blob, url) {
    return jBinary.load(blob, typeSet).then(binary => (
      this.parse(binary.readAll(), url)
    )).catch(err => {
      info('Fatal error', err);
      throw err;
    });
  }

  setPath(value) {
    this.path = value;
  }

  setMaterials(materials) {
    this.materials = materials;
  }

  _parseGeometry(section) {
    const data = this._getData(section);
    const geometry = new THREE.Geometry();

    const { vertices } = data;
    for (const [ x, y, z ] of vertices) {
      geometry.vertices.push(new THREE.Vector3(x, y, z));
    }

    const { indices, normals, vertexColors } = data;
    for (const [ b, a, materialIndex, c ] of indices) {
      const indexes = [a, b, c];
      const faceNormals = normals ? indexes.map(index => {
        const [ x, y, z ] = normals[index];
        return new THREE.Vector3(x, y, z);
      }) : null;
      const faceColors = vertexColors ? indexes.map(index => {
        const color = vertexColors[index];
        return new THREE.Color(parseInt(color, 16) & 0xFFFFFF);
      }) : null;
      geometry.faces.push(new THREE.Face3(a, b, c, faceNormals, faceColors, materialIndex));
    }

    const { textureCoords } = data;
    const uvLayer = geometry.faceVertexUvs[0] = [];
    for (const [ b, a, _, c ] of indices) {
      const uvs = [a, b, c].map(index => {
        const [ u, v ] = textureCoords[index];
        return new THREE.Vector2(u, 1 - v);
      });
      uvLayer.push(uvs);
    }

    geometry.dynamic = false;
    geometry.computeFaceNormals();
    geometry.computeBoundingSphere();

    this._geometry = geometry;
  }

  _parseMaterial(section, url) {
    const { textureCount } = this._getData(section);
    if (textureCount > 1) {
      throw new Error('Not supporting materials with more than one texture set');
    }
    const material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
    });
    if (!textureCount) {
      return material;
    }
    // The first child is data section
    const textureChild = section.children[1];
    // const { filterMode, addrModeU, addrModeV } = this._getData(textureChild);
    const [ colorFile, alphaFile ] = textureChild.children.filter(child => (
      child.type === 'RwString'
    )).map(child => (
      child.data
    ));
    // const AddresModeMap = {
    //   RwDefault: THREE.ClampToEdgeWrapping,
    //   RwWrap: THREE.RepeatWrapping,
    //   RwMirror: THREE.MirroredRepeatWrapping,
    //   RwClamp: THREE.ClampToEdgeWrapping,
    //   RwBorder: THREE.ClampToEdgeWrapping,
    // };
    const loader = new THREE.TextureLoader();
    loader.setPath(this.path);
    if (colorFile) {
      info('Loading color texture', colorFile);
      resolveTexturePath(url, `${colorFile.toUpperCase()}.BMP`).then(texturePath => {
        material.map = loader.load(texturePath);
        material.map.wrapS = THREE.RepeatWrapping; // AddresModeMap[addrModeU];
        material.map.wrapT = THREE.RepeatWrapping; // AddresModeMap[addrModeV];
      });
    }
    if (alphaFile) {
      info('Loading alpha texture', alphaFile);
      resolveTexturePath(url, `${alphaFile.toUpperCase()}.BMP`).then(texturePath => {
        material.alphaMap = loader.load(texturePath);
        material.alphaMap.wrapS = THREE.RepeatWrapping; // AddresModeMap[addrModeU];
        material.alphaMap.wrapT = THREE.RepeatWrapping; // AddresModeMap[addrModeV];
        material.transparent = true;
        material.alphaTest = 0.05;
      });
    }
    return material;
  }

  _handleRwFrameList(section) {
    const { frames } = this._getData(section);
    info('Found %d frames', frames.length);
    this._frames = frames;
    return true;
  }

  _handleRwGeometry(section) {
    if (this._geometry) {
      throw new Error('We currently support only single-geometry objects');
    }
    info('Found geometry %o', section);
    this._parseGeometry(section);
  }

  _handleRwMaterialList(section, _, url) {
    const { count } = this._getData(section);
    info('Found %d materials', count);
    this._materials = section.children.slice(1).map(child => (
      this._parseMaterial(child, url)
    ));
    return true;
  }

  parse(sections, url) {
    this._traverse(sections, '', url);
    if (!this._geometry) {
      throw new Error('No geometry found in dff data');
    }
    return new THREE.Mesh(this._geometry, new THREE.MultiMaterial(this._materials));
  }
};
