import React, { Component } from 'react';
import Codemirror from 'react-codemirror';
import { Col, Button, Tabs, Tab, Well } from 'react-bootstrap';
import Header from '../ui/header';
import Icon from '../ui/icon';

require('codemirror/mode/javascript/javascript');

const HelpText = `Mardown here ?`;


export default class Code extends Component {

  constructor(props) {
    super(props);
    this.state = { activeKey: 'code' };
  }

  handleSwitchTab(activeKey) {
    this.setState({ activeKey });
  }

  render() {

    const options = {
      mode: 'javascript',
      lineNumbers: true,
      gutters: ["CodeMirror-lint-markers"],
      lint: true
    };

    const { className, sm, onChange, value, onRun, loading } = this.props;
    return <Col className={className} sm={sm}>
      <Header title='Code'>
        <a onClick={onRun} href='#' className='m-0'>
          <Icon name={loading ? 'spinner' : 'play'}/> <strong>Preview</strong>
        </a>
      </Header>
      <hr/>
      <Codemirror value={value} onChange={onChange} options={options} />
    </Col>
  }
}

