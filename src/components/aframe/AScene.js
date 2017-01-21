import React, { Component, PropTypes } from 'react';

class AScene extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  state = {
    loaded: false,
  };

  handleSceneLoaded = () => {
    this.setState({ loaded: true });
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
