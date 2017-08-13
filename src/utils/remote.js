const { getRootPath } = require('./paths');

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
