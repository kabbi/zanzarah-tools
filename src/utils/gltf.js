const BufferList = require('bl');
const jDataView = require('jdataview');
const isObject = require('lodash/isObject');

exports.AccessorComponentTypes = {
  Byte: 5120,
  UnsignedByte: 5121,
  Short: 5122,
  UnsignedShort: 5123,
  Int: 5124,
  UnsignedInt: 5125,
  Float: 5126,
};

exports.AccessorTypes = {
  Scalar: 'SCALAR',
  Vector2D: 'VEC2',
  Vector3D: 'VEC3',
  Vector4D: 'VEC4',
  Matrix2D: 'MAT2',
  Matrix3D: 'MAT3',
  Matrix4D: 'MAT4',
};

exports.Dimensions = {
  // Size in bytes for scalars
  [exports.AccessorComponentTypes.Byte]: 1,
  [exports.AccessorComponentTypes.UnsignedByte]: 1,
  [exports.AccessorComponentTypes.Short]: 2,
  [exports.AccessorComponentTypes.UnsignedShort]: 2,
  [exports.AccessorComponentTypes.Int]: 4,
  [exports.AccessorComponentTypes.UnsignedInt]: 4,
  [exports.AccessorComponentTypes.Float]: 4,
  // Vector size for non-scalars
  [exports.AccessorTypes.Scalar]: 1,
  [exports.AccessorTypes.Vector2D]: 2,
  [exports.AccessorTypes.Vector3D]: 3,
  [exports.AccessorTypes.Vector4D]: 4,
  [exports.AccessorTypes.Matrix2D]: 2 * 2,
  [exports.AccessorTypes.Matrix3D]: 3 * 3,
  [exports.AccessorTypes.Matrix4D]: 4 * 4,
};

/**
 * A mapping from gltf to jBinary data types
 */
exports.DataTypes = {
  [exports.AccessorComponentTypes.Byte]: 'Int8',
  [exports.AccessorComponentTypes.UnsignedByte]: 'Uint8',
  [exports.AccessorComponentTypes.Short]: 'Int16',
  [exports.AccessorComponentTypes.UnsignedShort]: 'Uint16',
  [exports.AccessorComponentTypes.Int]: 'Int32',
  [exports.AccessorComponentTypes.UnsignedInt]: 'Uint32',
  [exports.AccessorComponentTypes.Float]: 'Float32',
};

const isReference = value => !isObject(value);

const toDataUri = (buffer, mimeType = 'application/octet-stream') => (
  `data:${mimeType};base64,${buffer.toString('base64')}`
);

// TODO: Make this builder browser-friendly

exports.GLTFBuilder = class GLTFBuilder {
  constructor(generator) {
    this.json = {
      asset: {
        version: '2.0',
        generator,
      },
    };

    this.mainBuffer = new BufferList();
    this.mainBufferIndex = this.addBuffer({});
  }

  ensureArray(entity) {
    if (!this.json[entity]) {
      this.json[entity] = [];
    }
  }

  getEntity(entity, index) {
    return this.json[entity][index];
  }

  addEntity(entity, data) {
    this.ensureArray(entity);

    const entityList = this.json[entity];
    let index = entityList.indexOf(data);
    if (index !== -1) {
      return index;
    }

    index = entityList.length;
    entityList.push(data);
    return index;
  }

  addAccessor(accessor) {
    if (!isReference(accessor.bufferView)) {
      accessor.bufferView = this.addBufferView(accessor.bufferView);
    }
    return this.addEntity('accessors', accessor);
  }

  addAnimation(animation) {
    return this.addEntity('animations', animation);
  }

  addBufferView(bufferView) {
    if (!isReference(bufferView.buffer)) {
      bufferView.buffer = this.addBuffer(bufferView.buffer);
    }
    return this.addEntity('bufferViews', bufferView);
  }

  addBuffer(buffer) {
    return this.addEntity('buffers', buffer);
  }

  addDefaultScene(scene) {
    const sceneIndex = this.addScene(scene);
    this.json.scene = sceneIndex;
    return sceneIndex;
  }

  addImage(image, mimeType = 'image/png') {
    if (Buffer.isBuffer(image.uri)) {
      image.uri = toDataUri(image.uri, image.mimeType || mimeType);
    }
    return this.addEntity('images', image);
  }

  addMaterial(material) {
    if (material.pbrMetallicRoughness) {
      const pbr = material.pbrMetallicRoughness;
      if (pbr.baseColorTexture && !isReference(pbr.baseColorTexture.index)) {
        pbr.baseColorTexture.index = this.addTexture(pbr.baseColorTexture.index);
      }
    }
    return this.addEntity('materials', material);
  }

  addMesh(mesh) {
    return this.addEntity('meshes', mesh);
  }

  addNode(node) {
    return this.addEntity('nodes', node);
  }

  addScene(scene) {
    return this.addEntity('scenes', scene);
  }

  addSkin(skin) {
    return this.addEntity('skins', skin);
  }

  addTexture(texture) {
    if (!isReference(texture.source)) {
      texture.source = this.addImage(texture.source);
    }
    return this.addEntity('textures', texture);
  }

  addAttributes(attributes, initialAccessor) {
    const { componentType, type } = initialAccessor;
    const vectorSize = exports.Dimensions[type];
    const componentSize = exports.Dimensions[componentType];
    let max = Array(vectorSize).fill(-Infinity);
    let min = Array(vectorSize).fill(Infinity);

    // Allocate buffer
    const dataView = new jDataView(
      attributes.length * vectorSize * componentSize,
      undefined, undefined, true
    );

    // Populate buffer
    for (const vec of attributes) {
      for (let i = 0; i < vectorSize; i++) {
        const value = vec[i];
        dataView[`write${exports.DataTypes[componentType]}`](value);
        if (value < min[i]) {
          min[i] = value;
        }
        if (value > max[i]) {
          max[i] = value;
        }
      }
    }

    if (componentType !== exports.AccessorComponentTypes.Float) {
      max = max.map(Math.round);
      min = min.map(Math.round);
    }

    // Append gltf structures
    const accessorIndex = this.addAccessor(Object.assign({}, initialAccessor, {
      count: attributes.length,
      max, min,
      bufferView: {
        buffer: this.mainBufferIndex,
        byteOffset: this.mainBuffer.length,
        byteLength: dataView.byteLength,
      },
    }));

    // Append global buffer data
    this.mainBuffer.append(dataView.buffer);
    if (this.mainBuffer.length % 4 !== 0) {
      // Add some padding so that every buffer would start on 4-byte boundary
      this.mainBuffer.append(Buffer.alloc(4 - (this.mainBuffer.length % 4)));
    }

    return accessorIndex;
  }

  build(pretty) {
    // Update main buffer length, serialize it to string
    const gltfBuffer = this.getEntity('buffers', this.mainBufferIndex);
    gltfBuffer.uri = toDataUri(this.mainBuffer);
    gltfBuffer.byteLength = this.mainBuffer.length;
    // Serialize json data
    return JSON.stringify(this.json, null, pretty ? 2 : 0);
  }
};
