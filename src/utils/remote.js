const path = require('path');
const keyBy = require('lodash/keyBy');

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

exports.resolveTexturePath = (modelPath, fileName) => {
  const modelDirName = path.basename(
    path.dirname(modelPath)
  );
  return exports.fetchIndex().then(files => {
    const existsIndex = keyBy(files);
    const filesToTry = [
      [CommonPaths.Textures, modelDirName, fileName],
      [CommonPaths.WorldTextures, fileName],
      [CommonPaths.MiscTextures, fileName],
    ].map(parts => (
      path.join(...parts)
    ));
    for (const file of filesToTry) {
      if (existsIndex[file]) {
        return file;
      }
    }
    throw new Error(`Texture not found ${fileName} of ${modelPath}`);
  });
};
