import React from 'react';

import AEntity from 'components/aframe/AEntity';
import { getRootPath } from 'utils/paths';

const Editor = () => (
  <AEntity tag="a-scene">
    <AEntity tag="a-sky" color="#ccccff"/>
    <AEntity grid/>
    <AEntity
      camera
      orbit-controls
      mouse-cursor={{
        objects: '[selectable]',
      }}
      />

    <AEntity
      gui
      gui-main
      />
    <AEntity
      fs
      // fs-dragndrop={{ openOnDrop: true }}
      fs-xhr={{ path: getRootPath() }}
      />

    <AEntity id="target">
      <AEntity
        tag="a-box"
        selectable
        transformable
        gui={{ lazy: true }}
        gui-opener={{ event: 'click' }}
        gui-entity-editor={{ exclude: 'gui.*' }}
        />
    </AEntity>
  </AEntity>
);

export default Editor;
