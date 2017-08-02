import { PropTypes } from 'prop-types';
import React, { Component } from 'react';

import AEntity from 'components/aframe/AEntity';
import TransparentBody from 'components/common/TransparentBody';

class Renderer extends Component {
  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        interactive: PropTypes.bool,
        path: PropTypes.string,
      }),
    }).isRequired,
  };

  render() {
    const { location: { query } } = this.props;
    const { path } = query;

    return (
      <AEntity tag="a-scene">
        <TransparentBody/>
        <AEntity grid/>
        <AEntity
          id="target"
          load={{
            url: path,
          }}
          />
        <AEntity
          camera
          orbit-controls={{
            target: '#target',
          }}
          />
      </AEntity>
    );
  }
}

export default Renderer;
