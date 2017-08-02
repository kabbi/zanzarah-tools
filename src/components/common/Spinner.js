import { PropTypes } from 'prop-types';
import React from 'react';
import cx from 'classnames';

import './Spinner.css';

const Spinner = ({ className }) => (
  <div className={cx('la-ball-scale', className)}>
    <div/>
  </div>
);

Spinner.propTypes = {
  className: PropTypes.string,
};

Spinner.defaultProps = {
  message: 'Loading preview...',
};

export default Spinner;
