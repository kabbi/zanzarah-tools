import path from 'path';
import React, { Component } from 'react';
import 'aframe/src';
import { GUI } from 'dat.gui/build/dat.gui';

import './vr';

import AScene from './components/aframe/AScene';
import { fetchIndex, filterFiles } from './utils/remote';

class App extends Component {
  state = {
    modelPath: null,
    worldPath: null,
  };

  componentDidMount() {
    this.setupGui();
  }

  getIndex() {
    this.index = fetchIndex();
    return this.index;
  }

  setupGui() {
    const context = {};

    const gui = new GUI();
    const load = gui.addFolder('Load');
    const statics = load.addFolder('Static');
    const backdrops = load.addFolder('Backdrops');
    const actors = load.addFolder('Actors');
    const worlds = load.addFolder('Worlds');

    this.getIndex().then(files => {
      for (const file of filterFiles(files, 'StaticModels', '.DFF')) {
        const itemName = path.basename(file);
        context[itemName] = () => {
          this.setState({ modelPath: file });
        };
        statics.add(context, itemName);
      }
    });
    this.getIndex().then(files => {
      for (const file of filterFiles(files, 'BackdropModels', '.DFF')) {
        const itemName = path.basename(file);
        context[itemName] = () => {
          this.setState({ modelPath: file });
        };
        backdrops.add(context, itemName);
      }
    });
    this.getIndex().then(files => {
      for (const file of filterFiles(files, 'ActorModels', '.DFF')) {
        const itemName = path.basename(file);
        context[itemName] = () => {
          this.setState({ modelPath: file });
        };
        actors.add(context, itemName);
      }
    });
    this.getIndex().then(files => {
      for (const file of filterFiles(files, 'Worlds', '.BSP')) {
        const itemName = path.basename(file);
        context[itemName] = () => {
          this.setState({ worldPath: file });
        };
        worlds.add(context, itemName);
      }
    });
  }

  render() {
    const { modelPath, worldPath } = this.state;

    return (
      <AScene>
        <a-entity camera="active: true" orbit-controls=""/>
        <a-sky color="#ccccff"/>
        <a-entity grid=""/>

        {modelPath && (
          <a-entity key={modelPath} dff-model={`dff: ${modelPath};`}/>
        )}
        {worldPath && (
          <a-entity key={worldPath} bsp-model={`bsp: ${worldPath};`}/>
        )}
      </AScene>
    );
  }
}

export default App;
