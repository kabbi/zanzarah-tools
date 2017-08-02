const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const { getRootPath } = require('../utils/paths');

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  const traverse = (targetPath, tree) => {
    const files = fs.readdirSync(targetPath);
    for (const file of files) {
      if (file.startsWith('.')) {
        continue;
      }
      const filePath = path.join(targetPath, file);
      const fstat = fs.statSync(filePath);
      if (fstat.isDirectory()) {
        const child = tree[file] = {};
        traverse(filePath, child);
      } else {
        tree[file] = null;
      }
    }
    return tree;
  };
  res.send(traverse(getRootPath(), {}));
});

app.use('/', express.static(getRootPath()));

app.listen(4343, () => {
  console.log('Serving zanzarah resources at http://localhost:4343/');
});
