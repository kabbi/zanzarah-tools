import path from 'path';
import { THREE } from 'aframe/src';

import { CommonPaths } from 'utils/paths';

THREE.RenderwareLoader = class RenderwareLoader {
  constructor() {
    const scene = document.querySelector('a-scene');
    this.fs = scene.systems.fs;
  }

  _getData(section) {
    if (!section.children || !section.children[0] || section.children[0].type !== 'RwData') {
      throw new Error(`No data section found for ${section.type}`);
    }
    return section.children[0].data;
  }

  _traverse(sections, path = '', ...otherArgs) {
    for (const section of sections) {
      const handlerName = `_handle${section.type}`;
      if (this[handlerName] && this[handlerName](section, path, ...otherArgs)) {
        continue;
      }
      if (section.children) {
        this._traverse(section.children, `${path}.${section.type}`, ...otherArgs);
      }
    }
  }

  async _resolveTexturePath(modelPath, fileName) {
    let modelDirName = path.basename(
      path.dirname(modelPath)
    );
    if (modelDirName === '.') {
      // When there is no dir detected, provide some fake one
      modelDirName = 'MODELS';
    }

    const filesToTry = [
      [CommonPaths.Textures, modelDirName, fileName],
      [CommonPaths.WorldTextures, fileName],
      [CommonPaths.ActorTextures, fileName],
      [CommonPaths.BackdropTextures, fileName],
      [CommonPaths.MiscTextures, fileName],
    ].map(parts => (
      path.join(...parts)
    ));

    for (const file of filesToTry) {
      if (await this.fs.includes({ url: file })) {
        return file;
      }
    }

    throw new Error(`Texture not found ${fileName} of ${modelPath}`);
  }
};
