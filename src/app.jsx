import _ from 'lodash';
import React, { Component } from 'react';
import { Grid, Col, Row, Button } from 'react-bootstrap';

import Header from './ui/header';
import ResultsPane from './results';
import CodePane from './code';
import UserPane from './user';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = this.buildState(props);
    this.autoCompute = _.debounce(this.handleCompute.bind(this, null), 1000);
  }

  buildState(props) {

    const userSearch = props.user && props.user.user && props.user.user.email;
    const state = {
      input: { value: JSON.stringify(props.user || {}, ' ', 2), dirty: false },
      code: { value: this.getCode(props), dirty: false },
      result: props.result,
      loading: false,
      saving: false,
      userSearch
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

  handleSearch(userSearch) {
    if (userSearch && !this.props.loading) {
      this.handleCompute({ userSearch });
    }
  }

  handleCompute(params) {
    this.compute(params || { user: JSON.parse(this.state.input.value) });
  }

  handleRun(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.handleCompute();
  }

  handleSave(params) {
    this.setState({ saving: true });
    this.compute(params || { user: JSON.parse(this.state.input.value), save: true });
  }

  compute(params) {
    if (this.state.loading) return false;
    this.setState({ loading: true });
    const code = this.state.code.value;
    const computeParams = Object.assign({}, params, { code, ship: this.props.ship });
    this.props.onCompute(computeParams).then((props) => {
      const state = this.buildState(props);
      this.setState(state);
    }, (err) => {
      this.setState({ loading: false, saving: false });
    });
  }

  render() {
    const { result, input, code, loading, saving, userSearch } = this.state;

    return <Grid fluid={true} className='pt-1'>
      <Row className='flexRow'>
        <UserPane
          className='flexColumn'
          sm={4}
          loading={loading}
          onSearch={this.handleSearch.bind(this)}
          onChange={this.handleChange.bind(this, 'input')}
          {...input} />
        <CodePane
          sm={4}
          className='flexColumn ps-0'
          loading={loading}
          onChange={this.handleChange.bind(this, 'code')}
          onRun={this.handleRun.bind(this)}
          {...code} />
        <ResultsPane className='flexColumn'
          sm={4}
          loading={loading}
          saving={saving}
          onSave={this.handleSave.bind(this, null)}
          loading={loading}
          {...result} />
      </Row>
    </Grid>
  }
}
