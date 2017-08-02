import { PropTypes } from 'prop-types';
import { Component } from 'react';

/**
 * To be used in iframes, removes iframe background from inside
 */

class TransparentBody extends Component {
  static propTypes = {
    something: PropTypes.any,
  };

  componentWillMount() {
    this.prevBackground = document.body.style.background;
    document.body.style.background = 'none';
  }

  componentWillUnmount() {
    document.body.style.background = 'none';
  }

  render() {
    return null;
  }
}

export default TransparentBody;
