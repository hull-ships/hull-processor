import _ from 'lodash';
import React, { Component } from 'react';
import { Grid, Col, Row, Button } from 'react-bootstrap';

import ResultsPane from './results';
import CodePane from './code';
import UserPane from './user';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this._onChange = this._onChange.bind(this);
  }

  componentWillMount() {
    this.props.engine.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    this.props.engine.removeChangeListener(this._onChange);
  }

  _onChange() {
    const state = this.props.engine.getState();
    this.setState(state);
  }

  handleSearch(userSearch) {
    if (userSearch && !this.state.loading) {
      this.props.engine.searchUser(userSearch);
    }
  }

  render() {
    const { result, user, loading, userSearch, initialized, error } = this.state;
    if (initialized) {
      return <Grid fluid={true} className='pt-1 flexColumn'>
        <Row className='flexRow'>
          <UserPane
            className='flexColumn'
            sm={6}
            loading={loading}
            onSearch={this.handleSearch.bind(this)}
            value={user}
            error={error}
            userSearch={userSearch} />
          <ResultsPane className='flexColumn'
            sm={6}
            loading={loading}
            error={error}
            {...this.state.result} />
        </Row>
      </Grid>
    } else {
      return <div>Loading...</div>;
    };
  }
}
