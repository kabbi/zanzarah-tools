/** @jsx html */

import path from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { typeSet as sceneTypeSet } from '../parsers/zanzarah-scene';
import { html, bind } from '../utils/components';
import { CommonPaths, getRootPath } from '../utils/paths';

const warn = debug('app:systems:loader:warn');

AFRAME.registerSystem('loader', {
  schema: {},

  init() {
    this.target = document.getElementById('target');
    this.unbind = bind(this, 'handleLoadFile', this.sceneEl, 'file-selected');
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
      <a-entity obj-model={{ obj: fileName }}/>
    );
  },
  handleDFF(fileName) {
    this.target.appendChild(
      <a-entity dff-model={{ dff: fileName }}/>
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
                geometry={{
                  primitive: 'sphere',
                  segmentsWidth: 4,
                  segmentsHeight: 2,
                  radius: 1,
                }}
                material={{
                  color: 'blue',
                  wireframe: true,
                }}
                />
            )}
            {Misc && (
              <a-entity
                bsp-model={{
                  bsp: `${CommonPaths.Worlds}/${Misc.sceneFile.toUpperCase()}.BSP`,
                }}
                />
            )}
            {Models_v3 && Models_v3.models.map(model => (
              <a-entity
                key={model.id}
                position={model.position.join(' ')}
                scale={model.scale.join(' ')}
                dff-model={{
                  dff: `${CommonPaths.StaticModels}/${model.fileName.toUpperCase()}.DFF`,
                }}
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
