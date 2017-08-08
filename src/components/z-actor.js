/** @jsx dom */

import { basename } from 'path';
import AFRAME from 'aframe/src';

import { dom } from 'utils/dom';
import { CommonPaths } from 'utils/paths';

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
    const {
      ModelFilename_Body,
      AnimationFilename_Body,
      ModelFilename_Wings,
      AnimationFilename_Wings,
      AttachWingsToBone,
    } = this.data;
    this.el.setAttribute('animation-mixer', {
      crossFadeDuration: 1,
      clip: '(none)',
    });
    this.el.setAttribute('dff-model', `${CommonPaths.ActorModels}/${ModelFilename_Body.toUpperCase()}`);
    if (ModelFilename_Wings) {
      let firstAnimation = null;
      if (AnimationFilename_Wings.length > 0) {
        const [{ fileName }] = AnimationFilename_Wings;
        firstAnimation = basename(fileName, '.ska');
      }
      this.el.appendChild(
        <a-entity
          attach-to-bone={AttachWingsToBone}
          dff-model={`${CommonPaths.ActorModels}/${ModelFilename_Wings.toUpperCase()}`}
          {...AnimationFilename_Wings.reduce((props, { fileName }) => {
            props[`ska-animation__${basename(fileName, '.ska')}`] = `${CommonPaths.ActorModels}/${fileName.toUpperCase()}`;
            return props;
          }, {})}
          animation-mixer={{
            clip: firstAnimation,
          }}
        />
      );
    }
    for (const { fileName } of AnimationFilename_Body) {
      this.el.setAttribute(
        `ska-animation__${basename(fileName, '.ska')}`,
        `${CommonPaths.ActorModels}/${fileName.toUpperCase()}`,
      );
    }
  },
});
