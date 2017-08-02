import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import { Navbar, Button } from 'react-bootstrap';
import styled from 'styled-components';

import AEntity from 'components/aframe/AEntity';

const InvisibleFrame = styled.div`
  width: 0;
  height: 0;
  overflow: hidden;
  display: inline-block;
`;

const AScene = styled(AEntity)`
  width: 1024px;
  height: 768px;
`;

class PreviewRenderer extends Component {
  static propTypes = {
    fs: PropTypes.object.isRequired,
    path: PropTypes.string,
  };

  state = {
    status: 'Starting up...',
    renderFile: null,
  };

  componentDidMount() {
    this.startRendering();
  }

  updateStatus(status) {
    this.setState({ status });
  }

  async startRendering() {
    const { fs, path } = this.props;
    this.updateStatus('Fetching index...');
    const index = await fs.index(path);
    this.updateStatus('Ready');
    const files = Object.keys(index)
      .filter(key => index[key] === null)
      .sort();
    for (const file of files) {
      await this.renderPreview(`${path}/${file}`);
      return;
    }
  }

  async renderPreview() {

  }

  render() {
    const { status, renderFile } = this.state;

    return (
      <Navbar.Form pullRight>
        <Button disabled>
          {status}
        </Button>

        <InvisibleFrame>
          <AScene tag="a-scene" embedded>
            {renderFile && (
              <AEntity
                id="target"
                load={{
                  url: renderFile,
                }}
                />
            )}
            <AEntity
              camera
              orbit-controls={{
                target: '#target',
              }}
              />
          </AScene>
        </InvisibleFrame>
      </Navbar.Form>
    );
  }
}

export default PreviewRenderer;
