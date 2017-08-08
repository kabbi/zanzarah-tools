/** @jsx dom */

import path from 'path';
import AFRAME, { THREE } from 'aframe/src';
import debug from 'debug';
import jBinary from 'jbinary';

import { typeSet as actorTypeSet } from 'parsers/zanzarah-actor';
import { typeSet as sceneTypeSet } from 'parsers/zanzarah-scene';
import { bind } from 'utils/components';
import { dom } from 'utils/dom';
import { getRootPath } from 'utils/paths';

const warn = debug('app:systems:loader:warn');

const CommonComponents = {
  selectable: true,
  transformable: true,
  'z-debug': true,
  gui: {
    lazy: true,
    name: 'Selection',
    target: '[gui-main]',
  },
  'gui-opener': {
    state: 'selected',
  },
  'gui-entity-editor': {
    include: 'z-.*',
  },
};

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
  handleMTL(fileName) {
    const { systems: { selectable } } = this.sceneEl;
    const selected = selectable.getSelectedEntity();
    if (!selected || !selected.hasAttribute('obj-model')) {
      warn('Can only apply mtl to selected obj model');
      return;
    }
    selected.setAttribute('obj-model', 'mtl', fileName);
  },
  handleImage(fileName) {
    const { systems: { selectable } } = this.sceneEl;
    const selected = selectable.getSelectedEntity();
    if (!selected) {
      warn('Can only apply image to selected model');
      return;
    }
    warn('Not yet supported: %s', fileName);
  },
  handleBMP(fileName) {
    this.handleImage(fileName);
  },
  handlePNG(fileName) {
    this.handleImage(fileName);
  },
  handleDFF(fileName) {
    this.target.appendChild(
      <a-entity
        dff-model={fileName}
        transformable
        selectable
      />
    );
  },
  handleBSP(fileName) {
    this.target.appendChild(
      <a-entity bsp-model={fileName}/>
    );
  },
  handleAED(fileName) {
    const loader = new THREE.FileLoader();
    loader.setPath(getRootPath());
    loader.setResponseType('blob');
    loader.load(fileName, blob => {
      jBinary.load(blob, actorTypeSet).then(binary => {
        const actor = binary.readAll();
        this.target.appendChild(
          <a-entity
            {...CommonComponents}
            z-actor={actor}
          />
        );
      }).catch(err => {
        warn('Error parsing actor: %o', err);
      });
    });
  },
  handleSCN(fileName) {
    const loader = new THREE.FileLoader();
    loader.setPath(getRootPath());
    loader.setResponseType('blob');
    loader.load(fileName, blob => {
      jBinary.load(blob, sceneTypeSet).then(binary => {
        const scene = binary.readAll();
        const {
          SceneOrigin,
          Misc,
          Lights,
          Triggers,
          FOModels_v4,
          Models_v3,
        } = scene;

        const offset = new THREE.Vector3()
          .fromArray(SceneOrigin.origin || [0, 0, 0])
          .multiplyScalar(-1);

        this.target.appendChild(
          <a-entity
            gui={{
              target: '[gui-main]',
              name: `Scene ${Misc.sceneFile}`,
            }}
            gui-scene
            z-scene={{ scene }}
            position={offset.toArray().join(' ')}
          >
            {SceneOrigin && (
              <a-entity
                position={SceneOrigin.origin.join(' ')}
                z-entity={{
                  type: 'origin',
                  singleton: true,
                }}
              />
            )}
            {Misc && (
              <a-entity
                {...CommonComponents}
                z-entity={{
                  type: 'world',
                  singleton: true,
                }}
                z-world={{
                  fileName: Misc.sceneFile,
                }}
              />
            )}
            {Models_v3 && Models_v3.models.map(model => (
              <a-entity
                {...CommonComponents}
                z-model={model}
                z-entity={{
                  type: 'model_v3',
                }}
              />
            ))}
            {FOModels_v4 && FOModels_v4.models.map(model => (
              <a-entity
                {...CommonComponents}
                z-fo-model={model}
                z-entity={{
                  type: 'fo_model_v4',
                }}
              />
            ))}
            {Lights && Lights.lights.map(light => (
              <a-entity
                {...CommonComponents}
                z-light={light}
                z-entity={{
                  type: 'light',
                }}
              />
            ))}
            {Triggers && Triggers.triggers.map(trigger => (
              <a-entity
                {...CommonComponents}
                z-trigger={trigger}
                z-entity={{
                  type: 'trigger',
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
