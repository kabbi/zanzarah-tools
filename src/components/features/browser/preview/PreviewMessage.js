import { PropTypes } from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import Spinner from 'components/common/Spinner';

const Container = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  &>div {
    flex: 0 1 auto;
  }
`;

const PreviewMessage = ({ message, icon }) => (
  <Container className="caption">
    <div>
      {icon}
    </div>
    <div>
      {message}
    </div>
  </Container>
);

PreviewMessage.propTypes = {
  message: PropTypes.node,
  icon: PropTypes.node,
};

PreviewMessage.defaultProps = {
  message: 'Loading preview...',
  icon: <Spinner/>,
};

export default PreviewMessage;
