import AFRAME from 'aframe/src';
import groupBy from 'lodash/groupBy';

AFRAME.registerComponent('z-scene', {
  schema: {
    scene: { type: 'string' },
  },

  getData() {
    const scene = { ...this.data.scene };
    const entitiesByType = groupBy(this.el.children, child => (
      child.components['z-entity'].data.type
    ));
    if (entitiesByType.fo_model_v4) {
      const models = entitiesByType.fo_model_v4.map(entity => (
        entity.components['z-fo-model'].data
      ));
      scene.FOModels_v4 = { models };
    }
    if (entitiesByType.model_v3) {
      const models = entitiesByType.model_v3.map(entity => (
        entity.components['z-model'].data
      ));
      scene.Models_v3 = { models };
    }
    if (entitiesByType.trigger) {
      const triggers = entitiesByType.trigger.map(entity => (
        entity.components['z-trigger'].data
      ));
      scene.Triggers = { triggers };
    }
    return scene;
  },
});
