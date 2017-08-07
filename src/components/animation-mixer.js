import AFRAME, { THREE } from 'aframe/src';

/**
 * This is taken from donmccurdy/aframe-extras
 * @see https://github.com/donmccurdy/aframe-extras/blob/master/src/loaders/animation-mixer.js
 */

const LoopMode = {
  once: THREE.LoopOnce,
  repeat: THREE.LoopRepeat,
  pingpong: THREE.LoopPingPong,
};

/**
 * Creates a RegExp from the given string, converting asterisks to .* expressions,
 * and escaping all other characters.
 */
function wildcardToRegExp(s) {
  return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
}

/**
 * RegExp-escapes all characters in the given string.
 */
function regExpEscape(s) {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

AFRAME.registerComponent('animation-mixer', {
  schema: {
    clip: { default: '*' },
    duration: { default: 0 },
    crossFadeDuration: { default: 0 },
    loop: { default: 'repeat', oneOf: Object.keys(LoopMode) },
    repetitions: { default: Infinity, min: 0 },
  },

  init() {
    this.model = null;
    this.mixer = null;
    this.clips = [];
    this.activeActions = [];

    this.el.addEventListener('model-loaded', event => {
      const { model } = event.detail;
      this.model = model;
      this.load();
    });
    this.el.addEventListener('animation-loaded', event => {
      const { clip } = event.detail;
      this.clips.push(clip);
      this.update({});
    });
  },

  load() {
    const { el } = this;
    this.mixer = new THREE.AnimationMixer(this.model);
    this.mixer.addEventListener('loop', event => {
      el.emit('animation-loop', {action: event.action, loopDelta: event.loopDelta});
    });
    this.mixer.addEventListener('finished', event => {
      el.emit('animation-finished', {action: event.action, direction: event.direction});
    });
    if (this.data.clip) {
      this.update({});
    }
  },

  remove() {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
  },

  update(previousData) {
    if (!previousData) {
      return;
    }

    this.stopAction();

    if (this.data.clip) {
      this.playAction();
    }
  },

  stopAction() {
    const { crossFadeDuration } = this.data;
    for (const action of this.activeActions) {
      if (crossFadeDuration) {
        action.fadeOut(crossFadeDuration);
      } else {
        action.stop();
      }
    }
    this.activeActions = [];
  },

  playAction() {
    if (!this.mixer) {
      return;
    }

    const { duration, repetitions, loop, crossFadeDuration } = this.data;
    const { model, clips } = this;

    if (clips.length === 0) {
      return;
    }

    const re = wildcardToRegExp(this.data.clip);

    for (const clip of clips) {
      if (!clip.name.match(re)) {
        continue;
      }
      const action = this.mixer.clipAction(clip, model);
      this.activeActions.push(action);
      action.enabled = true;
      if (duration) {
        action.setDuration(duration);
      }
      action
        .setLoop(LoopMode[loop], repetitions)
        .fadeIn(crossFadeDuration)
        .play();
    }
  },

  tick(t, dt) {
    if (this.mixer && !isNaN(dt)) {
      this.mixer.update(dt / 1000);
    }
  },
});
