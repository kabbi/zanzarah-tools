import path from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';

const warn = debug('app:vr:components:selected-model:warn');

AFRAME.registerComponent('selected-model', {
  dependencies: ['position'],

  schema: {
    wireframe: { default: false },
  },

  init() {
    this.handleLoadModel = this.handleLoadModel.bind(this);
    this.fsGui = document.querySelector('[gui]');
    this.fsGui.addEventListener('select', this.handleLoadModel);
    this.modelComponent = null;
  },

  update() {
    const { el } = this;
    const { wireframe } = this.data;
    const mesh = el.getObject3D('mesh');
    if (!mesh) {
      return;
    }
    mesh.traverse(child => {
      if (wireframe && child instanceof THREE.Mesh) {
        const geometry = new THREE.WireframeGeometry(child.geometry);
        const material = new THREE.LineBasicMaterial({ color: 0 });
        child.add(new THREE.LineSegments(geometry, material));
        child.material.visible = false;
      }
      if (!wireframe && child instanceof THREE.Mesh) {
        child.material.visible = true;
      }
      if (!wireframe && child instanceof THREE.LineSegments) {
        child.parent.remove(child);
      }
    });
  },

  remove() {
    this.fsGui.removeEventListener('select', this.handleLoadModel);
  },

  handleLoadModel(event) {
    const { detail: { fileName } } = event;
    const ext = path.extname(fileName).slice(1);
    const method = `handle${ext.toUpperCase()}`;
    if (this[method]) {
      this[method](fileName);
    } else {
      warn('Unsupported file format: %s, %s', ext, fileName);
    }
  },

  clearModel() {
    if (!this.modelComponent) {
      return;
    }
    this.el.removeAttribute(this.modelComponent);
  },

  // >TODO: Rewrite all hardcoded handlers here to the more scalable way, with
  // the central component registry that lists data type -> component associations

  handleOBJ(fileName) {
    this.el.setAttribute('obj-model', {
      obj: fileName,
    });
  },
  handleMTL(fileName) {
    const { el } = this;
    if (!el.components['obj-model']) {
      warn('Cannot apply mtl file, current model is not obj');
      return;
    }
    this.modelComponent = 'obj-model';
    this.el.setAttribute('obj-model', 'mtl', fileName);
  },
  handlePNG(fileName) {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) {
      warn('Cannot apply material without model selected');
      return;
    }
    const listeners = [];
    const loader = new THREE.TextureLoader();
    const texture = loader.load(fileName, () => {
      listeners.forEach(x => x());
    });
    mesh.traverse(child => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }
      if (!child.material) {
        child.material = new THREE.MeshBasicMaterial();
      }
      child.material.map = texture;
      listeners.push(() => {
        child.material.needsUpdate = true;
        child.material.map.sourceFile = fileName;
      });
    });
  },
  handleDFF(fileName) {
    this.modelComponent = 'dff-model';
    this.el.setAttribute('dff-model', {
      dff: fileName,
    });
  },
  handleBSP(fileName) {
    this.modelComponent = 'bsp-model';
    this.el.setAttribute('bsp-model', {
      bsp: fileName,
    });
  },
});
