import { basename } from 'path';
import AFRAME from 'aframe/src';

import { CommonPaths } from '../utils/paths';

AFRAME.registerComponent('z-actor', {
  schema: {
    ModelFilename_Body: { type: 'string' },
    ModelFilename_Wings: { type: 'string' },
    AnimationPoolID_Body: { type: 'number' },
    AnimationPoolID_Wings: { type: 'number' },
    AnimationFilename_Body: { type: 'string' },
    AnimationFilename_Wings: { type: 'string' },
    AttachWingsToBone: { type: 'number' },
    HeadBoneID: { type: 'number' },
    EffectBoneID: { type: 'number' },
  },

  init() {
    const { ModelFilename_Body, AnimationFilename_Body } = this.data;
    this.el.setAttribute('animation-mixer', {
      clip: '(none)',
    });
    this.el.setAttribute('dff-model', {
      dff: `${CommonPaths.ActorModels}/${ModelFilename_Body.toUpperCase()}`,
    });
    for (const { fileName } of AnimationFilename_Body) {
      this.el.setAttribute(
        `ska-animation__${basename(fileName, '.ska')}`,
        `${CommonPaths.ActorModels}/${fileName.toUpperCase()}`,
      );
    }
  },
});
