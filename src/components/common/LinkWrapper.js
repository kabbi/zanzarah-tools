import { PropTypes } from 'prop-types';
import React from 'react';
import { Route } from 'react-router-dom';

const LinkWrapper = ({ to, replace, children }) => (
  <Route>
    {({ history }) => React.cloneElement(children, {
      onClick: () => {
        history[replace ? 'replace' : 'push'](to);
      },
    })}
  </Route>
);

LinkWrapper.propTypes = {
  to: PropTypes.any,
  replace: PropTypes.bool,
  children: PropTypes.node,
};

export default LinkWrapper;
