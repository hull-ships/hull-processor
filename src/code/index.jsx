import React, { Component } from "react";
import Codemirror from "../ui/react-codemirror";
import { Col, Button, Tabs, Tab, Well } from "react-bootstrap";
import Header from "../ui/header";
import Icon from "../ui/icon";

require("codemirror/mode/javascript/javascript");

const HelpText = "Mardown here ?";

export default class Code extends Component {

  constructor(props) {
    super(props);
    this.state = { activeKey: "code" };
  }

  handleSwitchTab(activeKey) {
    this.setState({ activeKey });
  }

  render() {
    const options = {
      mode: "javascript",
      lineNumbers: true,
      gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      extraKeys: { "Ctrl-Q": cm => cm.foldCode(cm.getCursor()) },
      foldGutter: true,
      lint: true
    };

    const { className, sm, md, onChange, value } = this.props;
    const title = <span>Code <small><code>Ctrl-Q</code> to toggle code folding. Click save when done.</small></span>;
    return <Col className={className} md={md} sm={sm}>
      <Header title={title}/>
      <hr/>
      <Codemirror
        style={{ height: "auto" }}
        value={value}
        onChange={onChange}
        options={options}
      />
    </Col>;
  }
}

