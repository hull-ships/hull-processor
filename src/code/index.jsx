import React, { Component } from 'react';
import Codemirror from 'react-codemirror';
import { Tabs, Tab, Well } from 'react-bootstrap';
require('codemirror/mode/javascript/javascript');
require('codemirror/addon/lint/javascript-lint');


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
      readOnly: !!this.props.loading,
      gutters: ["CodeMirror-lint-markers"],
      lint: true
    };

    const { onChange, value } = this.props;

    return <Tabs justified activeKey={this.state.activeKey} onSelect={this.handleSwitchTab.bind(this)}>
      <Tab eventKey="code" title="Code"><Codemirror value={value} onChange={onChange} options={options} /></Tab>
      <Tab eventKey="help" title="Help"><Well>{HelpText}</Well></Tab>
    </Tabs>;
  }
}

