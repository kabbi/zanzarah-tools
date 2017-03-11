import AFRAME from 'aframe/src';

import { typeSet } from '../parsers/zanzarah-scene';
import { bind } from '../utils/components';
import { saveFile } from '../utils/files';

AFRAME.registerComponent('gui-scene', {
  dependencies: ['gui', 'z-scene'],
  init() {
    this.unbind = bind(this, 'handleGuiCreated', this.el, 'gui-created');
  },
  remove() {
    this.unbind();
  },

  handleGuiCreated(event) {
    if (event.target !== this.el) {
      return;
    }

    const { components } = this.el;
    const { detail: { gui } } = event;
    const { data: { scene } } = components['z-scene'];
    gui.close();

    if (scene.Version) {
      const about = gui.addFolder('About');
      about.add(scene.Version, 'author')
        .name('Author');
      about.add(scene.Version, 'buildVersion')
        .name('Build Version');
      about.add(scene.Version, 'date')
        .name('Date');
      about.add(scene.Version, 'time')
        .name('Time');
    }

    if (scene.Misc) {
      const misc = gui.addFolder('Misc');
      misc.add(scene.Misc, 'sceneFile')
        .name('File Name');
      misc.add(scene.Misc, 'scenePath')
        .name('Path');
      misc.add(scene.Misc, 'texturePath')
        .name('Texture');
    }

    if (scene.Backdrop) {
      const backdrop = gui.addFolder('Backdrop');
      backdrop.add(scene.Backdrop, 'fileName')
        .name('File Name');
    }

    this.guiContext = {};
    this.guiContext._loadModels = () => this.handleLoadModels();
    gui.add(this.guiContext, '_loadModels')
      .name('Load all models');

    this.guiContext = {};
    this.guiContext._save = () => this.handleSave();
    gui.add(this.guiContext, '_save')
      .name('Save scene');
  },

  handleSave() {
    const { components } = this.el;
    const scene = components['z-scene'].getData();
    saveFile(scene, typeSet, `${scene.Misc.sceneFile}.scn`, 'application/scn');
  },
  handleLoadModels(component) {
    if (!component) {
      this.handleLoadModels('z-fo-model');
      this.handleLoadModels('z-model');
      this.handleLoadModels('z-world');
      return;
    }
    for (const child of this.el.querySelectorAll(`[${component}]`)) {
      child.components[component].handleLoadModel();
    }
  },
});
