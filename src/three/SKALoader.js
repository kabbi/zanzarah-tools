import { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';
import size from 'lodash/size';

import { typeSet } from '../parsers/zanzarah-animation';

const verbose = debug('app:three:SKALoader:verbose');
const error = debug('app:three:SKALoader:error');

THREE.SKALoader = class SKALoader {
  constructor(manager) {
    this.manager = manager || THREE.DefaultLoadingManager;
  }

  load(url, onLoad, onProgress, onError) {
    verbose('Loading data %s', url);
    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.load(url, blob => {
      verbose('Loaded data from %s, %d bytes', url, blob.size);
      jBinary.load(blob, typeSet).then(binary => {
        onLoad(this.parse(binary.readAll()));
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

  setName(value) {
    this.name = value;
  }

  parse(animation) {
    const { duration, keyFrames } = animation;

    const keyFramesByBoneIndex = {};
    const boneIndexByKeyFrameIndex = {};
    const MagicKeyFrameIndexConstant = 36;
    for (let keyFrameIndex = 0; keyFrameIndex < keyFrames.length; keyFrameIndex++) {
      const keyFrame = keyFrames[keyFrameIndex];
      if (keyFrame.parent < 0) {
        boneIndexByKeyFrameIndex[keyFrameIndex] = keyFrameIndex;
        keyFramesByBoneIndex[keyFrameIndex] = [keyFrame];
      } else {
        const parentKeyFrameIndex = keyFrame.parent / MagicKeyFrameIndexConstant;
        const boneIndex = boneIndexByKeyFrameIndex[parentKeyFrameIndex];
        boneIndexByKeyFrameIndex[keyFrameIndex] = boneIndex;
        keyFramesByBoneIndex[boneIndex].push(keyFrame);
      }
    }

    const tracks = [];
    const boneCount = size(keyFramesByBoneIndex);
    for (let boneIndex = 0; boneIndex < boneCount; boneIndex++) {
      const boneKeyFrames = keyFramesByBoneIndex[boneIndex];
      const timeStops = [];
      const positionValues = [];
      const quaternionValues = [];
      for (const { time, position, rotation } of boneKeyFrames) {
        timeStops.push(time);
        positionValues.push(...position);
        const quaternion = new THREE.Quaternion(...rotation);
        quaternion.inverse();
        quaternionValues.push(
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w,
        );
      }

      const path = `.bones[${boneIndex}]`;
      tracks.push(new THREE.VectorKeyframeTrack(`${path}.position`, timeStops, positionValues));
      tracks.push(new THREE.QuaternionKeyframeTrack(`${path}.quaternion`, timeStops, quaternionValues));
    }

    return new THREE.AnimationClip(this.name, duration, tracks);
  }
};
