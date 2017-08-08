import AFRAME from 'aframe/src';

import { bind } from 'utils/components';

AFRAME.registerSystem('selectable', {
  init() {
    this.scenes = [];
    this.entities = [];
    this.selected = null;
    bind(this, 'handleClick', this.sceneEl, 'click');
  },

  register(entity) {
    this.entities.push(entity);
    return () => {
      const index = this.entities.indexOf(entity);
      this.entities.splice(index, 1);
    };
  },

  handleClick(event) {
    if (!(event instanceof CustomEvent)) {
      // Accept only a-frame events, not browser ones
      return;
    }
    const { target } = event;
    if (target === this.sceneEl) {
      this.unselect();
    } else {
      this.select(target);
    }
  },

  getSelectedEntity() {
    return this.selected;
  },
  select(entity) {
    if (this.selected === entity) {
      return;
    }
    this.unselect();
    this.selected = entity;
    this.selected.addState('selected');
  },
  unselect() {
    if (!this.selected) {
      return;
    }
    this.selected.removeState('selected');
    this.selected = null;
  },
});
