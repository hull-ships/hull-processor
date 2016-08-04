import React, { Component } from "react";
import _ from "lodash";
import { Col, Button, Tabs, Tab } from "react-bootstrap";
import Help from "../ui/help";

import Icon from "../ui/icon";
import Header from "../ui/header";
import Errors from "./errors";
import Output from "./output";

export default class Results extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      changes = {},
      errors = [],
      logs = [],
      payload,
      code,
      className,
      sm, md
     } = this.props;
    const ActivePane = (errors && errors.length) ? Errors : Output;
    const highlight = ((errors && errors.length) ? [] : _.map(_.keys(changes), k => `traits_${k}`) || []);
    const codeIsEmpty = code === "return {};" || code === "";

    const logOutput = logs.map(l => {
      return l.map(e => {
        return (typeof e === "string") ? e : JSON.stringify(e, null, 2);
      }).join(", ");
    }).join("\n");

    return (<Col className={className} md={md} sm={sm}>
      <Header title="Results">
        <Help showModal={codeIsEmpty}/>
      </Header>
      <hr/>
      <ActivePane
        changes={changes}
        logs={logOutput}
        errors={errors}
        payload={payload}
        highlight={highlight} />
    </Col>);
  }

}
