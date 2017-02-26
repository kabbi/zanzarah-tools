/** @jsx dom */

import path from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { typeSet as sceneTypeSet } from '../parsers/zanzarah-scene';
import { bind } from '../utils/components';
import { dom } from '../utils/dom';
import { getRootPath } from '../utils/paths';

const warn = debug('app:systems:loader:warn');

AFRAME.registerSystem('loader', {
  schema: {},

  init() {
    this.target = document.getElementById('target');
    bind(this, 'handleLoadFile', this.sceneEl, 'file-selected');
  },

  clear() {
    const { target } = this;
    while (target.firstChild) {
      target.removeChild(target.firstChild);
    }
  },
  handleLoadFile(event) {
    const { detail: { fileName } } = event;
    const ext = path.extname(fileName).slice(1);
    const method = `handle${ext.toUpperCase()}`;
    if (this[method]) {
      this[method](fileName);
    } else {
      warn('Unsupported file format: %s, %s', ext, fileName);
    }
  },

  handleOBJ(fileName) {
    this.target.appendChild(
      <a-entity
        obj-model={{ obj: fileName }}
        transformable
        selectable
        />
    );
  },
  handleDFF(fileName) {
    this.target.appendChild(
      <a-entity
        dff-model={{ dff: fileName }}
        transformable
        selectable
        />
    );
  },
  handleBSP(fileName) {
    this.target.appendChild(
      <a-entity bsp-model={{ bsp: fileName }}/>
    );
  },
  handleSCN(fileName) {
    const xhrLoader = new THREE.XHRLoader();
    xhrLoader.setPath(getRootPath());
    xhrLoader.setResponseType('blob');
    xhrLoader.load(fileName, blob => {
      jBinary.load(blob, sceneTypeSet).then(binary => {
        const scene = binary.readAll();
        const { SceneOrigin, Misc, Models_v3 } = scene;
        const offset = new THREE.Vector3()
          .fromArray(SceneOrigin.origin || [0, 0, 0])
          .multiplyScalar(-1);

        this.target.appendChild(
          <a-entity position={offset.toArray().join(' ')}>
            {SceneOrigin && (
              <a-entity
                position={SceneOrigin.origin.join(' ')}
                z-entity={{ type: 'origin', singleton: true }}
                />
            )}
            {Misc && (
              <a-entity
                z-entity={{ type: 'world', singleton: true }}
                z-world={{ fileName: Misc.sceneFile }}
                />
            )}
            {Models_v3 && Models_v3.models.map(model => (
              <a-entity
                selectable
                transformable
                z-entity={{ type: 'model_v3' }}
                z-model={model}
                />
            ))}
          </a-entity>
        );
      }).catch(err => {
        warn('Error parsing scene: %o', err);
      });
    });
  },
});
