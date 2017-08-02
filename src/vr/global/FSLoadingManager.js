import { THREE } from 'aframe/src';

THREE.FSLoadingManager = class FSLoadingManager extends THREE.LoadingManager {
  constructor(fs) {
    super();
    this.fs = fs;
  }
};
