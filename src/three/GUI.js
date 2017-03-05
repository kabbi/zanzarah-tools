import { GUI } from 'dat.gui/build/dat.gui';

// Add some missing methods

GUI.prototype.removeFolder = function (folder) {
  this.__ul.removeChild(folder.domElement.parentElement);

  delete this.__folders[folder.name];

  // Do we have saved appearance data for this folder?
  if (this.load && // Anything loaded?
      this.load.folders && // Was my parent a dead-end?
      this.load.folders[folder.name]) {
    delete this.load.folders[folder.name];
  }

  setImmediate(() => {
    this.onResize();
  });
};
