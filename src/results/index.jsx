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
      payload = {},
      errors = [],
      events = [],
      accountClaims = {},
      logs = [],
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

    const output = [];
    if (_.size(payload)) {
      output.push("/* Touched Attributes (The one your code touches) */");
      output.push(JSON.stringify(payload, null, 2));
    }
    if (_.size(changes)) {
      output.push("\n/* Changed Attributes (What actually changed) */");
      output.push(JSON.stringify(changes, null, 2));
    }
    if (events.length) {
      output.push("\n/* Emitted Events */");
      _.map(events, e => output.push(`track("${e.eventName}", ${JSON.stringify(e.properties, null, 2)})`));
    }
    if (_.size(accountClaims)) {
      output.push("\n/* Account Claims (Lookup strategy) */");
      output.push(JSON.stringify(accountClaims, null, 2));
    }
    return (<Col className={className} md={md} sm={sm}>
      <Header title="Results Preview">
        <Help showModal={codeIsEmpty}/>
      </Header>
      <hr/>
      <ActivePane
        changes={output.join("\n")}
        logs={logOutput}
        errors={errors.join("\n\n")}
        highlight={highlight} />
    </Col>);
  }
}
