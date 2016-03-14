import React, { Component } from 'react';
import _ from 'lodash';
import { Col, Button, Tabs, Tab } from 'react-bootstrap';

import Icon from '../ui/icon';
import Header from '../ui/header';
import Errors from './errors';
import Output from './output';

export default class Results extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { onRun, errors, className, sm } = this.props;
    const ActivePane = (errors && errors.length) ? Errors : Output;
    const highlight = ( (errors && errors.length) ? [] : _.keys(this.props.changes) || [])
    return <Col className={className} sm={sm}>
      <Header title='Output'>
        <a href='#' onClick={onRun}>
          <Icon name='valid'/>
          Save
        </a>
      </Header>
      <hr/>
      <ActivePane {...this.props} highlight={highlight}/>
    </Col>
  }

}
