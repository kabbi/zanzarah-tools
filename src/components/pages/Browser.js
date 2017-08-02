import pathUtils from 'path';
import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import DirectoryIcon from 'react-icons/lib/go/file-directory';

import BrowserHeader from 'components/features/browser/BrowserHeader';
import CurrentPath from 'components/features/browser/CurrentPath';
import FilePreviewCard from 'components/features/browser/FilePreviewCard';

import RateLimitFS from 'utils/filesystems/RateLimitFS';
import fs from 'utils/fs';

const MainGrid = styled(Grid)`
  margin-top: 1em;
`;

const FolderCol = styled(Col)`
  /* This one is to match bootstrap card margin */
  margin-bottom: 1.4em;
`;

class Browser extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.shape({
      query: PropTypes.shape({
        path: PropTypes.string,
      }).isRequired,
    }).isRequired,
  };

  state = {
    pending: false,
    folders: [],
    files: [],
  };

  componentWillMount() {
    this.fs = new RateLimitFS(fs, 1);
  }

  componentDidMount() {
    this.fetchFiles();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      this.fetchFiles();
    }
  }

  async fetchFiles() {
    const { location } = this.props;
    const { query: { path = '/' } } = location;
    this.setState({
      pending: true,
    });
    const index = await this.fs.index(path);
    const folders = Object.keys(index)
      .filter(key => index[key] !== null)
      .sort();
    const files = Object.keys(index)
      .filter(key => index[key] === null)
      .sort();
    this.setState({
      pending: false,
      folders,
      files,
    });
  }

  handleOpenFolder = path => {
    const { location, history } = this.props;
    const query = { ...location.query };
    if (path) {
      query.path = path;
    } else {
      delete query.path;
    }
    history.push({ query });
  };

  render() {
    const { location: { query } } = this.props;
    const { folders, files } = this.state;
    const { path = '' } = query;

    return (
      <MainGrid>
        <Row>
          <Col md={12}>
            <BrowserHeader fs={this.fs} path={path}/>
            <CurrentPath
              path={path}
              onUpdatePath={this.handleOpenFolder}
              />
            <Row>
              {folders.map(folder => (
                <FolderCol key={folder} md={3}>
                  <Button
                    onClick={this.handleOpenFolder.bind(null, pathUtils.join(path, folder))}
                    block
                    >
                    <DirectoryIcon/> {folder}
                  </Button>
                </FolderCol>
              ))}
            </Row>
            <Row>
              {files.map(file => (
                <Col key={file} md={3}>
                  <FilePreviewCard
                    fs={this.fs}
                    filePath={pathUtils.join(path, file)}
                    fileName={file}
                    />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </MainGrid>
    );
  }
}

export default Browser;
