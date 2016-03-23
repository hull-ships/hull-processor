import React, { Component } from 'react';
import _ from 'lodash';
import { Col, Button, Tabs, Tab } from 'react-bootstrap';
import Help from '../ui/help';

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
    const { onRun, onSave, errors, saving, className, sm, changes, code } = this.props;
    const ActivePane = (errors && errors.length) ? Errors : Output;
    const highlight = ( (errors && errors.length) ? [] : _.map(_.keys(changes), k => `traits_${k}`) || []);
    const codeIsEmpty = code === "return {};" || code === "";

    return <Col className={className} sm={sm}>
      <Header title='Output'>
        <Help showModal={!codeIsEmpty}/>
      </Header>
      <hr/>
      <ActivePane {...this.props} highlight={highlight}/>
    </Col>
  }

}
