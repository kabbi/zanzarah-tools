/** @jsx dom */

import { dom } from './utils/dom';
import { getRootPath } from './utils/paths';

import './index.css';
import './components';
import './systems';
import './three';

document.getElementById('root').replaceWith(
  <a-scene>
    <a-sky color="#ccccff"/>
    <a-entity grid/>
    <a-entity
      camera
      orbit-controls
      mouse-cursor={{
        objects: '[selectable]',
      }}
    />

    <a-entity
      gui
      gui-main
    />
    <a-entity
      fs
      fs-dragndrop={{ openOnDrop: true }}
      fs-xhr={{ path: getRootPath() }}
    />

    <a-entity id="target">
      {/* <a-box
        selectable
        transformable
        gui={{
          lazy: true,
          name: 'Selection',
          target: '[gui-main]',
        }}
        gui-opener={{ state: 'selected' }}
        gui-entity-editor={{ exclude: 'gui.*' }}
        z-debug
      /> */}
    </a-entity>
  </a-scene>
);
