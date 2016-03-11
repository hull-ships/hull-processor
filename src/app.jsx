import _ from 'lodash';
import React, { Component } from 'react';
import { Grid, Col, Row, Button } from 'react-bootstrap';

import ResultsPane from './results';
import CodePane from './code';
import UserPane from './user';
import Controls from './controls';


export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = this.buildState(props);
    this.autoCompute = _.debounce(this.handleCompute.bind(this, null), 1000);
  }

  buildState(props) {

    const userEmail = props.user && props.user.user && props.user.user.email;
    const state = {
      input: { value: JSON.stringify(props.user || {}, ' ', 2), dirty: false },
      code: { value: this.getCode(props), dirty: false },
      result: props.result,
      loading: false,
      userEmail
    };
    return state;
  }

  getCode(props) {
    const code = props.result.code || (props.ship.private_settings || {}).code;
    return code;
  }

  handleChange(section, value) {
    if (this.state.loading) return false;
    this.setState({ [section]: { value, dirty: true } });
    this.autoCompute();
  }

  handleCompute(params) {
    this.compute(params || { user: JSON.parse(this.state.input.value) });
  }

  compute(params) {
    if (this.state.loading) return false;
    this.setState({ loading: true });
    const code = this.state.code.value;
    this.props.onCompute(Object.assign({}, params, { code })).then((props) => {
      const state = this.buildState(props);
      this.setState(state);
    }, (err) => {
      console.warn("Oops... error", err);
      this.setState({ loading: false })
    });
  }

  render() {
    const { result, input, code, loading } = this.state;

    return <Grid fluid={true}>
      <Controls loading={this.state.loading} onRun={this.handleCompute.bind(this)} />
      <Row>
        <Col md={4}>
          <UserPane loading={this.state.loading} onChange={this.handleChange.bind(this, 'input')} {...input} />
        </Col>
        <Col md={4}>
          <CodePane loading={this.state.loading} onChange={this.handleChange.bind(this, 'code')} {...code}  />
        </Col>
        <Col md={4}>
          <ResultsPane loading={this.state.loading} {...result} />
        </Col>
      </Row>
    </Grid>
  }
}
