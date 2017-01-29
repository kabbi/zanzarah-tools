import AFRAME, { THREE } from 'aframe/src';
import { GUI } from 'dat.gui/build/dat.gui';
import FileSaver from 'file-saver';
// import debug from 'debug';

// const warn = debug('app:vr:components:fs-gui:warn');

AFRAME.registerComponent('gui', {
  init() {
    const { el: { sceneEl } } = this;
    const { systems: { fs } } = sceneEl;
    this.allFiles = [];
    this.dndFs = fs.getFilesystemById('dnd');
    this.reload = this.reload.bind(this);
    this.dndFs.entity.el.addEventListener('changed', this.reload);
    this.mainGui = new GUI();
    this.mainGui.add(this, 'exportDff')
      .name('Export to DFF');
    this.wireframe = false;
    this.mainGui.add(this, 'wireframe')
      .name('Wireframe')
      .onChange(this.toggleWireframe);
    this.mainGui.add(this, 'clearModel')
      .name('Clear');
  },
  remove() {
    this.dndFs.entity.el.removeEventListener('changed', this.reload);
  },
  reload() {
    this.dndFs.index().then(index => {
      this.allFiles = index;
      this.renderFsGui();
    });
  },
  renderFsGui() {
    const { el } = this;
    if (this.fsGui) {
      this.fsGui.destroy();
      this.fsGui = null;
    }
    this.fsGui = new GUI({ name: 'FS' });
    this.fsGuiContext = {};
    for (const fileName of this.allFiles) {
      this.fsGuiContext[fileName] = () => {
        el.emit('select', { fileName });
      };
      this.fsGui.add(this.fsGuiContext, fileName);
    }
  },
  exportDff() {
    const target = document.querySelector('[selected-model]');
    const exporter = new THREE.DFFExporter();
    const data = exporter.export(target.object3D);
    FileSaver.saveAs(data, 'model.dff');
  },
  toggleWireframe(flag) {
    const target = document.querySelector('[selected-model]');
    target.setAttribute('selected-model', 'wireframe', flag);
  },
  clearModel() {
    const target = document.querySelector('[selected-model]');
    target.components['selected-model'].clearModel();
  },
});
