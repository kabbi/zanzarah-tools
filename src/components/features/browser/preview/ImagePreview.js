import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components';

import PreviewMessage from './PreviewMessage';

const Image = styled.div`
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
`;

class ImagePreview extends Component {
  static propTypes = {
    fs: PropTypes.object.isRequired,
    filePath: PropTypes.string.isRequired,
  };

  state = {
    pending: true,
  };

  componentDidMount() {
    this.fetchImage();
  }

  async fetchImage() {
    const { fs, filePath } = this.props;
    this.setState({
      pending: true,
    });
    const imageUrl = await fs.load(filePath, 'url');
    this.setState({
      pending: false,
      imageUrl,
    });
  }

  render() {
    const { pending, imageUrl } = this.state;

    if (pending) {
      return <PreviewMessage/>;
    }

    return (
      <Image style={{ backgroundImage: `url(${imageUrl})`}}/>
    );
  }
}

export default ImagePreview;
