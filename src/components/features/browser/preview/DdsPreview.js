import { THREE } from 'aframe/src';
import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components';

import PreviewMessage from './PreviewMessage';

const IFrame = styled.iframe`
  background: transparent;
  width: 100%;
  height: 100%;
  border: 0;
`;

class ImagePreview extends Component {
  static propTypes = {
    fs: PropTypes.object.isRequired,
    filePath: PropTypes.string.isRequired,
  };

  state = {
    pending: false,
    rendered: false
  };

  componentDidMount() {
    this.fetchImage();
  }

  fetchImage() {
    const { fs, filePath } = this.props;
    // this.setState({
    //   pending: true,
    // });
    // const loader = new THREE.CompressedTextureLoader();
    // loader.manager = new THREE.FSLoadingManager(fs);
    // loader.load(filePath, texture => {
    //   this.setState({
    //     pending: false,
    //     texture,
    //   });
    // });
  }

  handleLoad = () => {
    this.setState({ loaded: true });
  };

  render() {
    const { filePath } = this.props;
    const { pending, loaded } = this.state;

    if (pending) {
      return <PreviewMessage/>;
    }

    return (
      <span>
        <IFrame
          className={loaded ? '' : 'hide'}
          src={`/renderer?path=${encodeURIComponent(filePath)}`}
          allowTransparency
          onLoad={this.handleLoad}
          />
        {!loaded && (
          <PreviewMessage message="Rendering..."/>
        )}
      </span>
    );
  }
}

export default ImagePreview;
