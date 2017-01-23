import AFRAME from 'aframe/src';

AFRAME.registerComponent('drop-load-model', {
  schema: {
    target: { type: 'selector' },
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

    const { target } = this.data;
    target.setAttribute('auto-model', 'files', Array.from(files));
  },
  remove() {
    const { el: { canvas } } = this;
    canvas.removeEventListener('dragover', this.handleDragOver);
    canvas.removeEventListener('drop', this.handleDrop);
  },
});
