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
      events = [],
      accountClaims = {},
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

    let output = "";
    if (_.size(changes)) {
      const traits = JSON.stringify(changes, null, 2);
      output = `/* TRAITS */
${traits}
`;
    }
    if (_.size(accountClaims)) {
      const claims = JSON.stringify(accountClaims, null, 2);
      output = `${output}
/* ACCOUNT CLAIMS */
${claims}
`;
    }
    if (events.length) {
      const eventString = _.map(events, e => {
        const props = JSON.stringify(e.properties, null, 2);
        return `track("${e.eventName}", ${props})
`; });
      output = `${output}
/* EVENTS */
${eventString}`;
    }
    return (<Col className={className} md={md} sm={sm}>
      <Header title="Results">
        <Help showModal={codeIsEmpty}/>
      </Header>
      <hr/>
      <ActivePane
        changes={output}
        logs={logOutput}
        errors={errors}
        payload={payload}
        highlight={highlight} />
    </Col>);
  }
}
