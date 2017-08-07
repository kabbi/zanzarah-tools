import AFRAME, { THREE } from 'aframe/src';

import { bind } from 'utils/components';

AFRAME.registerComponent('z-debug', {
  schema: {
    wireframe: { default: false },
    skeleton: { default: false },
  },

  init() {
    const { sceneEl } = this.el;
    this.scene = sceneEl.object3D;
    this.clips = [];
    this.unbind = bind(this, 'handleAnimationLoaded', this.el, 'animation-loaded');
  },
  update(oldData) {
    const { wireframe, skeleton, animation } = this.data;
    if (wireframe !== oldData.wireframe) {
      this.updateWireframe(wireframe);
    }
    if (skeleton !== oldData.skeleton) {
      this.updateWireframe(skeleton);
    }
    if (animation !== oldData.animation) {
      this.el.setAttribute('animation-mixer', 'clip', animation);
    }
  },
  remove() {
    // Clean-up our debug output
    this.updateWireframe(false);
    this.updateSkeleton(false);
  },

  handleAnimationLoaded(event) {
    const { clip } = event.detail;
    this.clips.push(clip);
    this.extendSchema({
      animation: {
        default: '(none)',
        oneOf: ['(none)'].concat(this.clips.map(({ name }) => name)),
      },
    });
  },

  updateWireframe(wireframe) {
    this.el.object3D.traverse(obj => {
      if (!obj.isMesh || !obj.material) {
        return;
      }
      const materials = obj.material.isMultiMaterial ?
        obj.material.materials : [obj.material];
      materials.forEach(m => {
        m.wireframe = wireframe;
      });
    });
  },
  updateSkeleton(skeleton) {
    if (skeleton && !this.skeletonHelpers) {
      this.skeletonHelpers = [];
      this.el.object3D.traverse(obj => {
        if (!obj.isSkinnedMesh) {
          return;
        }
        const helper = new THREE.SkeletonHelper(obj);
        this.skeletonHelpers.push(helper);
        this.scene.add(helper);
      });
    } else if (!skeleton && this.skeletonHelpers) {
      for (const helper of this.skeletonHelpers) {
        this.scene.remove(helper);
      }
      this.skeletonHelpers = null;
    }
  },
});
