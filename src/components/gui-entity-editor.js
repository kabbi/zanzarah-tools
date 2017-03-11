import AFRAME from 'aframe/src';

import { bind, callLater } from '../utils/components';

// eslint-disable-next-line import/prefer-default-export
export const GuiMethods = `Gui-callable method list - ${Math.random()}`;

AFRAME.registerComponent('gui-entity-editor', {
  dependencies: ['gui'],
  schema: {
    include: { default: '.+' },
    exclude: { default: '(?!)' },
  },

  init() {
    this.guiByComponent = {};
    this.unbind = callLater(
      bind(this, 'handleGuiCreated', this.el, 'gui-created'),
      bind(this, 'handleComponentUpdate', this.el, 'componentchanged'),
      bind(this, 'handleComponentSchemaChange', this.el, 'schemachanged'),
    );
  },
  remove() {
    this.unbind();
  },

  handleGuiCreated(event) {
    const { detail: { gui } } = event;
    this.gui = gui;

    const { include, exclude } = this.data;
    const includeRegExp = new RegExp(include);
    const excludeRegExp = new RegExp(exclude);

    const { components } = this.el;
    for (const key of Object.keys(components)) {
      if (excludeRegExp.test(key) || !includeRegExp.test(key)) {
        continue;
      }
      this.addComponent(key);
    }
  },
  handleComponentUpdate(event) {
    const { name: attrName, newData, oldData } = event.detail;
    const { isSingleProp } = AFRAME.components[attrName];
    if (!this.guiByComponent[attrName]) {
      return;
    }
    if (isSingleProp) {
      this.updateComponentControl(attrName, 'Value');
    } else {
      const propertyName = Object.keys(newData).find(key => (
        newData[key] !== oldData[key]
      ));
      this.updateComponentControl(attrName, propertyName);
    }
  },
  handleComponentSchemaChange(event) {
    const { component: attrName } = event.detail;
    if (!this.guiByComponent[attrName]) {
      return;
    }
    setImmediate(() => {
      this.updateComponent(attrName);
    });
  },

  getComponent(attrName) {
    const { schema } = this.el.components[attrName];
    const { isSingleProp } = AFRAME.components[attrName];
    return { isSingleProp, schema };
  },
  getComponentSchema(attrName, propertyName) {
    const { schema } = this.el.components[attrName];
    const { isSingleProp } = AFRAME.components[attrName];
    return isSingleProp ? schema : schema[propertyName];
  },
  getComponentValue(attrName, propertyName) {
    const { data } = this.el.components[attrName];
    const { isSingleProp } = AFRAME.components[attrName];
    const { stringify, type } = this.getComponentSchema(attrName, propertyName);

    const value = isSingleProp ? data : data[propertyName];
    if (value === null || value === undefined) {
      return '';
    }
    if (['number', 'int', 'boolean'].includes(type)) {
      return value;
    }
    return stringify(value);
  },
  setComponentValue(attrName, propertyName, value) {
    const { isSingleProp } = AFRAME.components[attrName];
    if (isSingleProp) {
      this.el.setAttribute(attrName, value);
    } else {
      this.el.setAttribute(attrName, propertyName, value);
    }
  },

  addComponent(attrName) {
    const folder = this.gui.addFolder(attrName);
    this.guiByComponent[attrName] = {
      controls: {},
      context: {},
      folder,
    };
    this.updateComponent(attrName);
  },
  updateComponent(attrName) {
    this.removeComponentControls(attrName);

    const component = this.el.components[attrName];
    const { folder, controls, context } = this.guiByComponent[attrName];
    const { schema, [GuiMethods]: methods = [] } = component;
    const { isSingleProp } = AFRAME.components[attrName];

    if (isSingleProp) {
      this.addComponentControl(attrName, 'Value');
    } else {
      for (const key of Object.keys(schema)) {
        this.addComponentControl(attrName, key);
      }
    }

    for (const [ methodName, label ] of methods) {
      context[methodName] = () => {
        component[methodName]();
      };
      controls[methodName] = folder.add(context, methodName)
        .name(label);
    }

    context._remove = () => {
      this.el.removeAttribute(attrName);
      this.gui.removeFolder(folder);
    };
    controls._remove = folder.add(context, '_remove')
      .name('Remove');
  },

  addComponentControl(attrName, propertyName) {
    const { oneOf } = this.getComponentSchema(attrName, propertyName);
    const { folder, controls, context } = this.guiByComponent[attrName];
    context[propertyName] = this.getComponentValue(attrName, propertyName);

    const params = oneOf ? [oneOf] : [];
    controls[propertyName] = folder.add(context, propertyName, ...params)
      .onChange(newValue => {
        this.setComponentValue(attrName, propertyName, newValue);
      });
  },
  updateComponentControl(attrName, propertyName) {
    const { controls, context } = this.guiByComponent[attrName];
    if (!controls[propertyName]) {
      return;
    }
    context[propertyName] = this.getComponentValue(attrName, propertyName);
    controls[propertyName].updateDisplay();
  },
  removeComponentControls(attrName) {
    const { folder, controls } = this.guiByComponent[attrName];
    this.guiByComponent[attrName].controls = {};
    this.guiByComponent[attrName].context = {};
    for (const [ propertyName, control ] of Object.entries(controls)) {
      if (!this.getComponentSchema(attrName, propertyName)) {
        this.el.removeAttribute(attrName, propertyName);
      }
      folder.remove(control);
    }
  },
});
