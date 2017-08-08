import { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';
import keyBy from 'lodash/keyBy';

import { resolveTexturePath } from 'utils/remote';
import { typeSet } from 'parsers/renderware';
import './RenderwareLoader';

const verbose = debug('app:three:DFFLoader:verbose');
const error = debug('app:three:DFFLoader:error');

const ColorCoefficent = 10;

THREE.DFFLoader = class DFFLoader extends THREE.RenderwareLoader {
  constructor(manager) {
    super();
    this.manager = manager || THREE.DefaultLoadingManager;
    this.materials = null;
  }

  load(url, onLoad, onProgress, onError) {
    verbose('Loading data %s', url);
    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.load(url, blob => {
      verbose('Loaded data from %s, %d bytes', url, blob.size);
      jBinary.load(blob, typeSet).then(binary => {
        onLoad(this.parse(binary.readAll(), url));
      }).catch(err => {
        error('Fatal error', err);
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
      verbose('Fatal error', err);
      throw err;
    });
  }

  setPath(value) {
    this.path = value;
  }

  setMaterials(materials) {
    this.materials = materials;
  }

  _getTriangleGroups(section) {
    const groups = {};
    // >TODO: Utilize material split section here
    const { indices } = this._getData(section);
    for (const [ b, a, materialIndex, c ] of indices) {
      groups[materialIndex] = groups[materialIndex] || [];
      groups[materialIndex].push([a, b, c]);
    }
    return groups;
  }

  _parseGeometry(section) {
    const { vertices, normals, vertexColors, textureCoords} = this._getData(section);
    const geometry = new THREE.BufferGeometry();

    const triangleGroups = this._getTriangleGroups(section);
    const triangleCount = Object.keys(triangleGroups).reduce((sum, key) => (
      sum + triangleGroups[key].length
    ), 0);

    const positionBuffer = new THREE.BufferAttribute(
      new Float32Array(triangleCount * 3 * 3), 3
    );
    const normalBuffer = normals && new THREE.BufferAttribute(
      new Float32Array(triangleCount * 3 * 3), 3, true
    );
    const colorBuffer = vertexColors && new THREE.BufferAttribute(
      new Uint8Array(triangleCount * 3 * 3), 3, true
    );
    const uvBuffer = textureCoords && new THREE.BufferAttribute(
      new Float32Array(triangleCount * 3 * 2), 2, true
    );

    let vertexPos = 0;
    const newVertexIndices = {};
    for (const materialIndex of Object.keys(triangleGroups)) {
      const faces = triangleGroups[materialIndex];
      geometry.addGroup(vertexPos, faces.length * 3, Number(materialIndex));
      for (const indices of faces) {
        for (const index of indices) {
          const [ vx, vy, vz ] = vertices[index];
          positionBuffer.setXYZ(vertexPos, vx, vy, vz);
          newVertexIndices[index] = newVertexIndices[index] || [];
          newVertexIndices[index].push(vertexPos);
          if (normalBuffer) {
            const [ nx, ny, nz ] = normals[index];
            normalBuffer.setXYZ(vertexPos, nx, ny, nz);
          }
          if (uvBuffer) {
            const [ u, v ] = textureCoords[index];
            uvBuffer.setXY(vertexPos, u, 1 - v);
          }
          if (colorBuffer) {
            const color = parseInt(vertexColors[index], 16);
            colorBuffer.setXYZ(vertexPos,
              Math.min(((color & 0xFF0000) >> 8 * 2) * ColorCoefficent, 255),
              Math.min(((color & 0x00FF00) >> 8 * 1) * ColorCoefficent, 255),
              Math.min(((color & 0x0000FF) >> 8 * 0) * ColorCoefficent, 255),
            );
          }
          vertexPos += 1;
        }
      }
    }

    geometry.dynamic = false;
    geometry.addAttribute('position', positionBuffer);
    if (normalBuffer) {
      geometry.addAttribute('normal', normalBuffer, true);
    } else {
      geometry.computeFaceNormals();
    }
    if (colorBuffer) {
      geometry.addAttribute('color', colorBuffer, true);
    }
    if (uvBuffer) {
      geometry.addAttribute('uv', uvBuffer);
    }
    geometry.computeBoundingSphere();

    // We have altered vertex indices here, so all the code later should use this
    // translation map (old index -> array of new indices) when referencing vertices
    this._vertexIndexTranslation = newVertexIndices;
    this._geometry = geometry;
  }

  _parseFrameHierarchy(section) {
    const { frames } = this._getData(section);
    const extensions = section.children.slice(1).map(s => s.children);
    return frames.map((frame, index) => ({
      extensions: keyBy(extensions[index], 'type'),
      ...frame,
    }));
  }

  _attachSkin(section) {
    const { bones, vertexCount, boneIndices, boneWeights } = section.data;
    if (!this._frames) {
      throw new Error('We need frame hierarchy to make a skeleton');
    }

    const { count: newVertexCount } = this._geometry.getAttribute('position');
    const indicesBuffer = new THREE.Float32BufferAttribute(newVertexCount * 4, 4);
    const weightsBuffer = new THREE.Float32BufferAttribute(newVertexCount * 4, 4);
    for (let index = 0; index < vertexCount; index++) {
      for (const newIndex of this._vertexIndexTranslation[index]) {
        indicesBuffer.setXYZW(newIndex, ...boneIndices[index]);
        weightsBuffer.setXYZW(newIndex, ...boneWeights[index]);
      }
    }
    this._geometry.addAttribute('skinIndex', indicesBuffer);
    this._geometry.addAttribute('skinWeight', weightsBuffer);

    const frameByBoneId = keyBy(this._frames, 'extensions.RwAnimPlugin.data.boneId');
    const threeBoneById = {};
    const threeBones = [];

    for (const bone of bones) {
      const frame = frameByBoneId[bone.id];
      if (!frame) {
        throw new Error('Each bone must have an associated frame');
      }
      const threeBone = new THREE.Bone();
      const transform = new THREE.Matrix4();
      transform.set(
        frame.transform[0], frame.transform[3], frame.transform[6], frame.offset[0],
        frame.transform[1], frame.transform[4], frame.transform[7], frame.offset[1],
        frame.transform[2], frame.transform[5], frame.transform[8], frame.offset[2],
        0, 0, 0, 1
      );
      threeBone.applyMatrix(transform);
      threeBoneById[bone.id] = threeBone;
      threeBones.push(threeBone);
      if (frame.parentFrame !== -1) {
        const parentFrame = this._frames[frame.parentFrame];
        const parentBoneId = parentFrame.extensions.RwAnimPlugin.data.boneId;
        const parentThreeBone = threeBoneById[parentBoneId];
        if (parentThreeBone) {
          parentThreeBone.add(threeBone);
        }
      }
    }

    for (const material of this._materials) {
      material.skinning = true;
    }

    this._bones = threeBones;
  }

  _parseMaterial(section, url) {
    const { textureCount } = this._getData(section);
    if (textureCount > 1) {
      throw new Error('Not supporting materials with more than one texture set');
    }
    const hasColors = Boolean(this._geometry.getAttribute('color'));
    const material = new THREE.MeshBasicMaterial({
      vertexColors: hasColors ? THREE.VertexColors : THREE.NoColors,
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
      verbose('Loading color texture', colorFile);
      resolveTexturePath(url, `${colorFile.toUpperCase()}.BMP`).then(texturePath => {
        material.map = loader.load(texturePath, () => {
          material.needsUpdate = true;
          material.map.sourceFile = url;
        });
        material.map.wrapS = THREE.RepeatWrapping; // AddresModeMap[addrModeU];
        material.map.wrapT = THREE.RepeatWrapping; // AddresModeMap[addrModeV];
      });
    }
    if (alphaFile) {
      verbose('Loading alpha texture', alphaFile);
      resolveTexturePath(url, `${alphaFile.toUpperCase()}.BMP`).then(texturePath => {
        material.alphaMap = loader.load(texturePath, () => {
          material.needsUpdate = true;
          material.alphaMap.sourceFile = url;
        });
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
    verbose('Found %d frames', frames.length);
    this._frames = this._parseFrameHierarchy(section);
    return true;
  }

  _handleRwGeometry(section) {
    if (this._geometry) {
      throw new Error('We currently support only single-geometry objects');
    }
    verbose('Found geometry %o', section);
    this._parseGeometry(section);
  }

  _handleRwSkinPlugin(section) {
    if (!this._geometry) {
      throw new Error('Skin is defined before geometry');
    }
    this._attachSkin(section);
  }

  _handleRwMaterialList(section, _, url) {
    const { count } = this._getData(section);
    verbose('Found %d materials', count);
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
    const Mesh = this._bones ? THREE.SkinnedMesh : THREE.Mesh;
    const material = new THREE.MultiMaterial(this._materials);
    const mesh = new Mesh(this._geometry, material);
    if (this._bones) {
      const skeleton = new THREE.Skeleton(this._bones);
      mesh.add(this._bones[0]);
      mesh.bind(skeleton);
    }
    this._geometry = null;
    return mesh;
  }
};
