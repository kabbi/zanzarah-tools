import AFRAME from 'aframe/src';

import { bind, callLater } from '../utils/components';

AFRAME.registerComponent('gui-entity-editor', {
  dependencies: ['gui'],
  schema: {
    include: { default: '.+' },
    exclude: { default: '(?!)' },
  },

  init() {
    this.unbind = callLater(
      bind(this, 'handleGuiCreated', this.el, 'gui-created'),
    );
  },
  remove() {
    this.unbind();
  },

  handleGuiCreated(event) {
    const { detail: { gui } } = event;
    this.guiContext = {};

    const { include, exclude } = this.data;
    const includeRegExp = new RegExp(include);
    const excludeRegExp = new RegExp(exclude);

    const { components } = this.el;
    for (const key of Object.keys(components)) {
      if (excludeRegExp.test(key) || !includeRegExp.test(key)) {
        continue;
      }
      this.addComponent(gui, AFRAME.components[key], components[key]);
    }
  },

  addComponent(gui, componentDef, component) {
    const context = {};
    const folder = gui.addFolder(component.attrName);
    if (componentDef.isSingleProp) {
      context.value = componentDef.stringify(component.data);
      folder.add(context, 'value')
        .name('Value')
        .onChange(newValue => {
          this.el.setAttribute(component.attrName, newValue);
        });
    } else {
      for (const key of Object.keys(component.schema)) {
        const { stringify } = component.schema[key];
        const value = component.data[key];

        // eslint-disable-next-line eqeqeq, no-eq-null
        context[key] = (value == null) ? '' : stringify(value);
        folder.add(context, key)
          .onChange(newValue => {
            this.el.setAttribute(component.attrName, key, newValue);
          });
      }
    }
    context._remove = () => {
      this.el.removeAttribute(component.attrName);
      gui.removeFolder(folder);
    };
    folder.add(context, '_remove')
      .name('Remove');
  },
});
