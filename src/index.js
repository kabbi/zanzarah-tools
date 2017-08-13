/** @jsx dom */

import { dom } from './utils/dom';

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
      gui-main={{
        fsToBrowse: 'dnd',
      }}
    />
    <a-entity
      fs
      fs-zip
      fs-browser
      fs-dragndrop={{ openOnDrop: true }}
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
