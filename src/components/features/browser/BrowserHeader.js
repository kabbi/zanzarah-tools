import { PropTypes } from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Nav,
  NavItem,
  Navbar,
} from 'react-bootstrap';

import PreviewRenderer from './PreviewRenderer';
import LinkWrapper from 'components/common/LinkWrapper';

const BrowserHeader = ({ fs, path, onPreviewProgress }) => (
  <Navbar>
    <Navbar.Header>
      <Navbar.Brand>
        <Link to="/">Zanzarah</Link>
      </Navbar.Brand>
      <Navbar.Toggle/>
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <LinkWrapper to="/">
          <NavItem active={!path}>
            All Files
          </NavItem>
        </LinkWrapper>
        <LinkWrapper to={{ query: { path: 'Pack/MODELS' }}}>
          <NavItem active={path === 'Pack/MODELS'}>
            Models
          </NavItem>
        </LinkWrapper>
        <LinkWrapper to={{ query: { path: 'Resources/Worlds' }}}>
          <NavItem active={path === 'Resources/Worlds'}>
            Scenes
          </NavItem>
        </LinkWrapper>
      </Nav>
      <PreviewRenderer
        fs={fs}
        path={path}
        onProgress={onPreviewProgress}
        />
    </Navbar.Collapse>
  </Navbar>
);

BrowserHeader.propTypes = {
  fs: PropTypes.object,
  path: PropTypes.string,
  onPreviewProgress: PropTypes.func,
};

export default BrowserHeader;
