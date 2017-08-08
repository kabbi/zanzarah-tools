import { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { resolveTexturePath } from 'utils/remote';
import { typeSet } from 'parsers/renderware';
import './RenderwareLoader';

const verbose = debug('app:three:BSPLoader:verbose');
const error = debug('app:three:BSPLoader:error');

const ColorMultiplier = 2;

THREE.BSPLoader = class BSPLoader extends THREE.RenderwareLoader {
  constructor(manager) {
    super();
    this.manager = manager || THREE.DefaultLoadingManager;
    this.materials = null;
  }

  load(url, onLoad, onProgress, onError) {
    verbose('Loading data %s', url);
    this._url = url;
    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.load(url, blob => {
      verbose('Loaded data from %s, %d bytes', url, blob.size);
      jBinary.load(blob, typeSet).then(binary => {
        onLoad(this.parse(binary.readAll()), this._meta);
      }).catch(err => {
        error('Fatal error', err);
        if (onError) {
          onError(err);
        }
      });
    }, onProgress, onError);
  }

  setPath(value) {
    this.path = value;
  }

  _parseGeometry(data) {
    const geometry = new THREE.Geometry();

    const { vertices } = data;
    for (const [ x, y, z ] of vertices) {
      geometry.vertices.push(new THREE.Vector3(x, y, z));
    }

    const { indices, colors } = data;
    for (const [ materialIndex, a, b, c ] of indices) {
      const indexes = [a, b, c];
      const faceColors = colors ? indexes.map(index => {
        const color = colors[index];
        return new THREE.Color(parseInt(color, 16) & 0xFFFFFF)
          .multiplyScalar(ColorMultiplier);
      }) : null;
      geometry.faces.push(new THREE.Face3(a, b, c, null, faceColors, materialIndex));
    }

    const { textureCoords } = data;
    const uvLayer = geometry.faceVertexUvs[0] = [];
    // eslint-disable-next-line no-unused-vars
    for (const [ _, a, b, c ] of indices) {
      const uvs = [a, b, c].map(index => {
        const [ u, v ] = textureCoords[index];
        return new THREE.Vector2(u, 1 - v);
      });
      uvLayer.push(uvs);
    }

    geometry.dynamic = false;
    geometry.computeFaceNormals();
    geometry.computeBoundingSphere();
    return new THREE.BufferGeometry()
      .fromGeometry(geometry);
  }

  _parseMaterial(section) {
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
    const [ colorFile, alphaFile ] = textureChild.children.filter(child => (
      child.type === 'RwString'
    )).map(child => (
      child.data
    ));
    const loader = new THREE.TextureLoader();
    loader.setPath(this.path);
    if (colorFile) {
      resolveTexturePath(this._url, `${colorFile.toUpperCase()}.BMP`).then(texturePath => {
        verbose('Loading color texture', colorFile, texturePath);
        material.map = loader.load(texturePath, () => {
          material.needsUpdate = true;
        });
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
      });
    }
    if (alphaFile) {
      resolveTexturePath(this._url, `${alphaFile.toUpperCase()}.BMP`).then(texturePath => {
        verbose('Resolved texture path', alphaFile, texturePath);
        material.alphaMap = loader.load(texturePath, () => {
          material.needsUpdate = true;
        });
        material.alphaMap.wrapS = THREE.RepeatWrapping;
        material.alphaMap.wrapT = THREE.RepeatWrapping;
        material.transparent = true;
        material.alphaTest = 0.05;
      });
    }
    return material;
  }

  _handleRwMaterialList(section) {
    const { count } = this._getData(section);
    verbose('Found %d materials', count);
    this._materials = section.children.slice(1).map(child => (
      this._parseMaterial(child)
    ));
    return true;
  }

  _handleRwWorld(section) {
    const { invWorldOrigin, flags } = this._getData(section);
    verbose('Found world section', flags);
    this._meta = {
      invertedOrigin: invWorldOrigin,
    };
  }

  _handleRwAtomicSector(section) {
    const data = this._getData(section);

    const { vertices, indices } = data;
    verbose('Processing sector, %d vertices, %d indices', vertices.length, indices.length);

    const geometry = this._parseGeometry(data);
    const material = new THREE.MultiMaterial(this._materials);
    const mesh = new THREE.Mesh(geometry, material);
    this._group.add(mesh);
  }

  parse(sections) {
    this._group = new THREE.Group();
    this._traverse(sections);
    if (this._group.children.length === 0) {
      throw new Error('No geometry found in bsp data');
    }

    verbose('Parsed %d groups', this._group.children.length);

    return this._group;
  }
};
