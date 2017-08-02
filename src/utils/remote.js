const path = require('path');
const has = require('lodash/has');

const { CommonPaths, getRootPath } = require('./paths');

let indexCache = null;

exports.fetchJson = url => (
  fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(response => (
    response.json()
  ))
);

exports.fetchIndex = () => {
  if (!indexCache) {
    indexCache = exports.fetchJson(`${getRootPath()}`);
  }
  return indexCache;
};

exports.filterFiles = (files, category, ext) => {
  const prefix = CommonPaths[category];
  return files.filter(file => (
    file.startsWith(prefix) && file.endsWith(ext)
  ));
};

// >TODO: Rethink texture resolving
exports.resolveTexturePath = (modelPath, fileName) => {
  let modelDirName = path.basename(
    path.dirname(modelPath)
  );
  if (modelDirName === '.') {
    // When there is no dir detected, provide some fake one
    modelDirName = 'MODELS';
  }

  return exports.fetchIndex().then(index => {
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
      if (has(index, file.split('/'))) {
        return file;
      }
    }
    throw new Error(`Texture not found ${fileName} of ${modelPath}`);
  });
};
