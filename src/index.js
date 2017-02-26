/** @jsx html */

import { html } from './utils/components';
import { getRootPath } from './utils/paths';

import './components';
import './systems';
import './three';

document.getElementById('root').replaceWith(
  <a-scene>
    <a-entity camera orbit-controls/>
    <a-sky color="#ccccff"/>
    <a-entity grid/>

    <a-entity
      gui
      gui-main
      />
    <a-entity
      fs
      fs-dragndrop
      fs-xhr={`path: ${getRootPath()}`}
      />

    <a-entity id="target"/>
  </a-scene>
);
