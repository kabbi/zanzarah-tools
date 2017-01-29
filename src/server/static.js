const path = require('path');
const express = require('express');
const { Glob } = require('glob');
const cors = require('cors');

const { getRootPath } = require('../utils/paths');

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  const cwd = getRootPath();
  const glob = new Glob('**', { cwd }, (err, files) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.send(files.map(file => {
      const fullPath = path.join(getRootPath(), file);
      if (Array.isArray(glob.cache[fullPath])) {
        return `${file}/`;
      }
      return file;
    }));
  });
});

app.use('/', express.static(getRootPath()));

app.listen(4343, () => {
  console.log('Serving zanzarah resources at http://localhost:4343/');
});
