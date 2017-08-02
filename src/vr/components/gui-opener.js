import AFRAME from 'aframe/src';

import { bind, callLater } from 'utils/components';

AFRAME.registerComponent('gui-opener', {
  dependencies: ['gui'],
  schema: {
    event: { type: 'string' },
  },

  init() {
    const { event } = this.data;
    this.unbind = callLater(
      bind(this, 'handleEvent', this.el, event),
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
