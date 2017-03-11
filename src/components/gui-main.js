import AFRAME from 'aframe/src';
import size from 'lodash/size';

import { bind, callLater } from '../utils/components';

AFRAME.registerComponent('gui-main', {
  dependencies: ['gui'],
  init() {
    this.fsEntity = document.querySelector('[fs]');
    this.unbind = callLater(
      bind(this, 'handleFsUpdate', this.fsEntity, 'fs-updated'),
      bind(this, 'handleGuiCreated', this.el, 'gui-created'),
    );
  },
  remove() {
    this.gui.removeFolder(this.fsFolder);
    this.unbind();
  },

  handleGuiCreated(event) {
    const { detail: { gui } } = event;
    this.guiContext = {};
    this.gui = gui;

    this.fsFolder = this.gui.addFolder('Files');
    this.guiContext.clearScene = () => this.handleClearScene();
    this.gui.add(this.guiContext, 'clearScene')
      .name('Clear workspace');

    this.fileControls = [];
    this.guiContext.helpMessage = 'Drop files here';
    this.fsFolder.add(this.guiContext, 'helpMessage')
      .name('Tip');
  },

  handleFileClick(fileName) {
    this.el.emit('file-selected', { fileName });
  },
  async handleFsUpdate(event) {
    const { detail: { id } } = event;
    for (const fileControl of this.fileControls) {
      this.fsFolder.remove(fileControl);
    }
    this.fileControls = [];
    this.fsGuiContext = {};
    const { components: { fs } } = this.fsEntity;
    for (const fileName of await fs.getFilesystemById(id).index()) {
      this.fsGuiContext[fileName] = () => this.handleFileClick(fileName);
      this.fileControls.push(this.fsFolder.add(this.fsGuiContext, fileName));
    }
    if (size(this.fsGuiContext) > 0) {
      this.fsGuiContext._clear = () => this.handleClearFiles();
      this.fileControls.push(
        this.fsFolder.add(this.fsGuiContext, '_clear')
          .name('Clear all files')
      );
    }
  },
  handleClearFiles() {
    const { components } = this.fsEntity;
    components['fs-dragndrop'].reset();
  },
  handleClearScene() {
    const { el: { sceneEl } } = this;
    const { systems: { loader } } = sceneEl;
    loader.clear();
  },
});
