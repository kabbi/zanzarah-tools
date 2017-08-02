import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import omit from 'lodash/omit';

class AEntity extends Component {
  static propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    tag: PropTypes.string,
    children: PropTypes.node,
  };

  static defaultProps = {
    tag: 'a-entity',
  };

  componentDidMount() {
    this.syncAttributes();
  }

  componentDidUpdate() {
    this.syncAttributes();
  }

  syncAttributes() {
    const { element } = this;
    const components = omit(this.props, Object.keys(AEntity.propTypes));
    for (const [ key, value ] of Object.entries(components)) {
      element.setAttribute(key, value);
    }
  }

  saveRef = element => {
    this.element = element;
  };

  render() {
    const { tag, id, className, children } = this.props;
    return React.createElement(tag, {
      id,
      className,
      ref: this.saveRef,
    }, children);
  }
}

export default AEntity;
