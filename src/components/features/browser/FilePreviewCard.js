import pathUtils from 'path';
import { PropTypes } from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import GoX from 'react-icons/lib/go/x';
import styled from 'styled-components';

import PreviewMessage from './preview/PreviewMessage';
import ImagePreview from './preview/ImagePreview';

const PreviewContent = styled.div`
  height: 200px;
`;

const UnknownFileType = {
  component: () => (
    <PreviewMessage
      message="Preview not available"
      icon={<GoX/>}
      />
  ),
};

const FileTypes = {
  bmp: {
    component: ImagePreview,
    link: 'none',
  },
};

const PreviewCard = ({ fs, filePath, fileName }) => {
  const fileExt = pathUtils.extname(fileName).slice(1).toLowerCase();
  const fileType = FileTypes[fileExt] || UnknownFileType;
  const { component: Component, link } = fileType;
  const content = [
    <PreviewContent key="preview">
      <Component fs={fs} filePath={filePath}/>
    </PreviewContent>,
    <div key="caption" className="caption">
      {fileName}
    </div>,
  ];

  if (link === 'none') {
    return (
      <div className="thumbnail">
        {content}
      </div>
    );
  }

  return (
    <Link className="thumbnail" to="/">
      {content}
    </Link>
  );
};

PreviewCard.propTypes = {
  fs: PropTypes.object.isRequired,
  filePath: PropTypes.string,
  fileName: PropTypes.string,
};

export default PreviewCard;
