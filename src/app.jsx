import React, { Component } from "react";
import { Grid, Col, Row, Button } from "react-bootstrap";

import UserPane from "./user";
import CodePane from "./code";
import ResultsPane from "./results";

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
    this.setState(state);
  }

  handleSearch(userSearch) {
    if (userSearch && !this.state.loading) {
      this.props.engine.searchUser(userSearch);
    }
  }

  handleCodeUpdate(code) {
    this.props.engine.updateCode(code);
  }

  render() {
    const { user, loading, userSearch, initialized, error, ship = {} } = this.state;
    const { private_settings = {} } = ship;
    const { code = "" } = private_settings;
    if (initialized) {
      return <Grid fluid={true} className="pt-1">
        <Row className="flexRow">
          <UserPane
            className="flexColumn userPane"
            sm={4}
            md={3}
            loading={loading}
            onSearch={this.handleSearch.bind(this)}
            value={user}
            error={error}
            userSearch={userSearch} />
          <CodePane
            className="flexColumn userPane"
            onChange={this.handleCodeUpdate.bind(this)}
            value={code}
            sm={4}
            md={6}
          />
          <ResultsPane
            className="flexColumn pl-1 resultPane"
            sm={4}
            md={3}
            loading={loading}
            error={error}
            {...this.state.result} />
        </Row>
      </Grid>
    }
    return <div className="text-center pt-2"><h4>Loading...</h4></div>;
  }
}
