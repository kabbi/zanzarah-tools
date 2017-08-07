import AFRAME from 'aframe/src';

import { bind, callLater } from '../utils/components';

AFRAME.registerComponent('gui-opener', {
  dependencies: ['gui'],
  schema: {
    state: { type: 'string' },
  },

  init() {
    this.unbind = callLater(
      bind(this, 'handleStateAdded', this.el, 'stateadded'),
      bind(this, 'handleStateRemoved', this.el, 'stateremoved'),
      bind(this, 'handleGuiCreated', this.el, 'gui-created'),
    );
  },
  remove() {
    this.unbind();
  },

  handleEvent() {
    const { components: { gui } } = this.el;
    gui.create();
  },
  handleStateAdded(event) {
    const { detail: { state } } = event;
    const { state: desiredState } = this.data;
    if (state !== desiredState) {
      return;
    }
    const { components: { gui } } = this.el;
    gui.create();
  },
  handleStateRemoved(event) {
    const { detail: { state } } = event;
    const { state: desiredState } = this.data;
    if (state !== desiredState) {
      return;
    }
    const { components: { gui } } = this.el;
    gui.destroy();
  },
  handleGuiCreated(event) {
    const { detail: { gui } } = event;
    const closeButton = gui.domElement.querySelector('.close-button');
    if (!closeButton) {
      return;
    }
    closeButton.addEventListener('click', () => {
      this.el.components.gui.destroy();
    });
  },
});
