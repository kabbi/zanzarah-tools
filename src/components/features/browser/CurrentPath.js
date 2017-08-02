import { join as joinPath } from 'path';
import { PropTypes } from 'prop-types';
import React from 'react';
import { Breadcrumb } from 'react-bootstrap';

const CurrentPath = ({ path, onUpdatePath }) => {
  const parts = [{
    path: '',
    name: 'Root',
  }];
  let currentPath = '';
  for (const part of path.split('/')) {
    if (!part) {
      continue;
    }
    currentPath = joinPath(currentPath, part);
    parts.push({
      path: currentPath,
      name: part,
    });
  }

  return (
    <Breadcrumb>
      {parts.map((part, index) => (
        <Breadcrumb.Item
          key={index}
          active={part.path === path}
          onClick={onUpdatePath.bind(null, part.path)}
          >
          {part.name}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

CurrentPath.propTypes = {
  path: PropTypes.string,
  onUpdatePath: PropTypes.func.isRequired,
};

export default CurrentPath;
