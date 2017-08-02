import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';

import { bind } from 'utils/components';

const warn = debug('app:vr:components:z-trigger:warn');

AFRAME.registerComponent('z-trigger', {
  dependencies: ['z-entity'],
  schema: {
    id: { type: 'string' },
    type: { type: 'string' },
    _unknownFlag: { type: 'number' },
    _unknownVector: { type: 'array' },
    kind: { type: 'number' },
    params: { type: 'array' },
    _unknownString: { type: 'string' },
    position: { type: 'array' },
    rotation: { type: 'array' },
    target: { type: 'array' },
    radius: { type: 'number' },
  },

  init() {
    this.unbind = bind(this, 'handleComponentChanged', this.el, 'componentchanged');
  },
  update(oldData) {
    const { object3D, components } = this.el;
    const zEntity = components['z-entity'];

    const { type, position, rotation } = this.data;
    object3D.position.fromArray(position);
    object3D.rotation.x = rotation[1] * Math.PI / 2;
    object3D.rotation.y = Math.atan2(rotation[0], rotation[2]);

    if (oldData.type !== type) {
      zEntity.toggleMarker(true);
      if (this.el.getObject3D('mesh')) {
        this.el.removeObject3D('mesh');
      }
      switch (type) {
        case 'UnknownTrigger0': {
          const { target } = this.data;
          const geometry = new THREE.SphereBufferGeometry(0.5, 4, 2);
          const material = new THREE.MeshBasicMaterial({
            color: zEntity.getMarkerColor(),
            wireframe: true,
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.fromArray(target).sub(object3D.position);
          this.el.setObject3D('mesh', sphere);
          break;
        }
        case 'UnknownTrigger1': {
          const { radius } = this.data;
          const geometry = new THREE.SphereBufferGeometry(radius, 8, 8);
          const material = new THREE.MeshBasicMaterial({
            color: zEntity.getMarkerColor(),
            wireframe: true,
          });
          const sphere = new THREE.Mesh(geometry, material);
          this.el.setObject3D('mesh', sphere);
          zEntity.toggleMarker(false);
          break;
        }
        case 'UnknownTrigger2': {
          // Nothing special here
          break;
        }
        default:
          warn('Unsupported trigger type: %s', type);
      }
    }
  },
  remove() {
    this.el.removeObject3D('mesh');
  },

  handleComponentChanged(event) {
    const { name, newData } = event.detail;
    if (name === 'position') {
      const { x, y, z } = newData;
      this.el.setAttribute(this.attrName, 'position', [x, y, z]);
    }
    if (name === 'rotation') {
      const { y } = newData;
      const { rotation: oldRotation } = this.data;
      this.el.setAttribute(this.attrName, 'rotation', [
        Math.sin(THREE.Math.degToRad(y)), oldRotation[1],
        Math.cos(THREE.Math.degToRad(y)),
      ]);
    }
  },
});
