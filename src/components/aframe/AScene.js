import React, { Component, PropTypes } from 'react';
import noop from 'lodash/noop';

class AScene extends Component {
  static propTypes = {
    children: PropTypes.node,
    onLoad: PropTypes.func,
  };

  static defaultProps = {
    onLoad: noop,
  };

  handleSceneLoaded = () => {
    const { onLoad } = this.props;
    onLoad();
  };

  sceneRef = element => {
    if (this.element) {
      this.element.removeEventListener('loaded', this.handleSceneLoaded);
      this.element = null;
    }
    this.element = element;
    element.addEventListener('loaded', this.handleSceneLoaded);
  };

  render() {
    const { children, ...otherProps } = this.props;

    return (
      <a-scene ref={this.sceneRef} {...otherProps}>
        {children}
      </a-scene>
    );
  }
}

export default AScene;
