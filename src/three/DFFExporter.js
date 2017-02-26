import path from 'path';
import { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { typeSet } from '../parsers/renderware';
import { section } from '../utils/renderware';

const warn = debug('app:three:DFFExporter:warn');

THREE.DFFExporter = class DFFExporter {
  export(object) {
    const meshes = [];
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });
    if (meshes.length === 0) {
      warn('No meshes found to export');
      return;
    }
    const data = this._generateRwClump(meshes);
    warn('Exported %O', data);
    const binary = new jBinary(JSON.stringify(data).length, typeSet);
    const bytesWritten = binary.writeAll(data);
    const buffer = binary.view.buffer.slice(0, bytesWritten);
    return new Blob([buffer], {
      type: 'application/dff',
    });
  }

  _generateRwClump(meshes) {
    const [ mesh ] = meshes;
    return [
      section('RwClump', {
        count: 1,
      }, [
        section('RwFrameList', {
          frames: [{
            transform: [
              1, 0, 0,
              0, 1, 0,
              0, 0, 1,
            ],
            // >TODO: Calculate offset properly
            offset: [0, 0, 0],
            parentFrame: -1,
          }],
        }, [
          section('RwExtension', []),
        ]),
        section('RwAtomic', {
          frameIndex: 0,
          geometryIndex: 5,
        }, [
          this._generateRwGeometry(mesh),
          section('RwExtension', []),
        ]),
        section('RwExtension', []),
      ]),
    ];
  }

  _generateRwGeometry(mesh) {
    let geometry = null;
    if (mesh.geometry.isGeometry) {
      geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry);
    } else if (mesh.geometry.isBufferGeometry) {
      geometry = mesh.geometry;
    } else {
      throw new Error('Geometry type not supported');
    }

    const positionBuffer = geometry.getAttribute('position');
    const normalBuffer = geometry.getAttribute('normal');
    // const colorBuffer = geometry.getAttribute('color');
    const uvBuffer = geometry.getAttribute('uv');

    const data = {
      vertices: [],
      indices: [],
      vertexColors: [],
    };

    for (let i = 0; i < positionBuffer.count; i++) {
      const x = positionBuffer.getX(i);
      const y = positionBuffer.getY(i);
      const z = positionBuffer.getZ(i);
      data.vertices.push([x, y, z]);
    }

    const groups = geometry.groups.length > 0 ? geometry.groups : [{
      start: 0,
      count: positionBuffer.count,
      materialIndex: 0,
    }];
    for (const { start, count, materialIndex } of groups) {
      for (let i = 0; i < count; i += 3) {
        data.indices.push([
          start + i + 1,
          start + i + 0,
          materialIndex,
          start + i + 2,
        ]);
      }
    }

    for (let i = 0; i < positionBuffer.count; i++) {
      data.vertexColors.push('0xffffffff');
    }

    if (normalBuffer) {
      data.normals = [];
      for (let i = 0; i < normalBuffer.count; i++) {
        const x = normalBuffer.getX(i);
        const y = normalBuffer.getY(i);
        const z = normalBuffer.getZ(i);
        data.normals.push([x, y, z]);
      }
    }

    if (uvBuffer) {
      data.textureCoords = [];
      for (let i = 0; i < uvBuffer.count; i++) {
        const u = uvBuffer.getX(i);
        const v = uvBuffer.getY(i);
        data.textureCoords.push([u, 1 - v]);
      }
    }

    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }

    return section('RwGeometry', {
      flags: {
        RwTextured: Boolean(uvBuffer),
        RwPrelit: true,
        RwNormals: Boolean(normalBuffer),
        RwLight: true,
      },
      ...data,
      triangleCount: positionBuffer.count / 3,
      vertexCount: positionBuffer.count,
      // >TODO: Why 1? We don't have any, but is seems most
      // static objects have this set to one.
      morphTargetCount: 1,
      lighting: {
        ambient: 1,
        specular: 1,
        diffuse: 1,
      },
      boundingSphere: {
        position: geometry.boundingSphere.center.toArray(),
        radius: geometry.boundingSphere.radius,
      },
      extraInfo: {
        hasPositions: 1,
        hasNormals: normalBuffer ? 1 : 0,
      },
    }, [
      this._generateRwMaterialList(mesh),
      section('RwExtension', []),
    ]);
  }

  _generateRwMaterialList(mesh) {
    const materials = mesh.material.isMultiMaterial ?
      mesh.material.materials : [mesh.material];
    return section('RwMaterialList', {
      count: materials.length,
      _unknown: new Array(materials.length).fill(-1),
      // You see, no RwExtension here...
    }, materials.map(this._generateRwMaterial, this));
  }

  _generateRwMaterial(material) {
    return section('RwMaterial', {
      color: '0xFFFFFF',
      // >FIXME: What is this?
      _unknown2: 31545202,
      textureCount: 1,
    }, [
      this._generateRwTexture(material),
      section('RwExtension', []),
    ]);
  }

  _generateRwTexture(material) {
    const { map, alphaMap } = material;
    const getMapFile = m => {
      if (!m || !m.sourceFile) {
        return '';
      }
      const ext = path.extname(m.sourceFile);
      return path.basename(m.sourceFile, ext);
    };
    return section('RwTexture', {
      filterMode: 'RwLinearMipLinear',
      addrModeU: 'RwWrap',
      addrModeV: 'RwWrap',
    }, [
      section('RwString', getMapFile(map)),
      section('RwString', getMapFile(alphaMap)),
      section('RwExtension', []),
    ]);
  }
};
