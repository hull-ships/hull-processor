import React, { Component } from "react";
import { Grid, Col, Row, Button } from "react-bootstrap";

import ResultsPane from "./results";
import UserPane from "./user";

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    this.props.engine.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    this.props.engine.removeChangeListener(this._onChange);
  }

  _onChange = () => {
    const state = this.props.engine.getState();
    console.log(state)
    this.setState(state);
  }

  handleSearch(userSearch) {
    if (userSearch && !this.state.loading) {
      this.props.engine.searchUser(userSearch);
    }
  }

  render() {
    const { user, loading, userSearch, initialized, error } = this.state;
    if (initialized) {
      return <Grid fluid={true} className="pt-1">
        <Row className="flexRow">
          <UserPane
            className="flexColumn userPane"
            sm={6}
            loading={loading}
            onSearch={this.handleSearch.bind(this)}
            value={user}
            error={error}
            userSearch={userSearch} />
          <ResultsPane
            className="flexColumn pl-1 resultPane"
            sm={6}
            loading={loading}
            error={error}
            {...this.state.result} />
        </Row>
      </Grid>
    }
    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
