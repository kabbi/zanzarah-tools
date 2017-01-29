import AFRAME from 'aframe/src';

AFRAME.registerComponent('drop-load-model', {
  schema: {
    target: { type: 'string' },
  },

  init() {
    const { el: { canvas } } = this;
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    canvas.addEventListener('dragover', this.handleDragOver);
    canvas.addEventListener('drop', this.handleDrop);
  },
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  },
  handleDrop(event) {
    const { dataTransfer: { files } } = event;
    event.preventDefault();
    if (!files || files.length === 0) {
      return;
    }
    // Give fs-dragndrop some time to catch the same file and add it to virtual fs
    setImmediate(() => {
      const target = document.querySelector(this.data.target);
      target.setAttribute('auto-model', 'files', Array.from(files));
    });
  },
  remove() {
    const { el: { canvas } } = this;
    canvas.removeEventListener('dragover', this.handleDragOver);
    canvas.removeEventListener('drop', this.handleDrop);
  },
});
