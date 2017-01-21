const express = require('express');
const glob = require('glob');
const cors = require('cors');

const { getRootPath } = require('../utils/paths');

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  glob('**', {
    cwd: getRootPath(),
  }, (err, files) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.send(files);
  });
});

app.use('/', express.static(getRootPath()));

app.listen(4343, () => {
  console.log('Serving zanzarah resources at http://localhost:4343/');
});
