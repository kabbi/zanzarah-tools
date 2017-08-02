import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import qhistory from 'qhistory';
import { createBrowserHistory } from 'history';
import { stringify, parse } from 'qs';

import 'bootswatch/superhero/bootstrap.min.css';
import 'vr';

import Renderer from './pages/Renderer';
import Browser from './pages/Browser';
import Editor from './pages/Editor';

const history = qhistory(
  createBrowserHistory(),
  stringify,
  parse
);

const App = () => (
  <Router history={history}>
    <Switch>
      <Route path="/" exact component={Browser}/>
      <Route path="/editor" component={Editor}/>
      <Route path="/renderer" component={Renderer}/>
    </Switch>
  </Router>
);

export default App;
