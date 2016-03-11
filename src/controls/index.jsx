import React, { Component } from 'react';
import SearchForm from './search-form';
import { Button, Grid, Row, Col } from 'react-bootstrap';

export default class Controls extends Component {

  handleSearch(userSearch) {
    if (userSearch && !this.props.loading) {
      this.props.onRun({ userSearch });
    }
  }

  handleRun(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.props.onRun();
  }

  render() {

    const { loading, onRun, userSearch } = this.props;

    return (
      <Row>
        <Col md={4}>
          <SearchForm loading={loading}
                      userSearch={userSearch}
                      onSubmit={this.handleSearch.bind(this)} /></Col>
        <Col md={4}></Col>
        <Col md={4}>
          <Button bsStyle="primary" className="pull-right" onClick={this.handleRun.bind(this)}>
            { loading ? "Loading" : "Run" }
          </Button>
        </Col>
      </Row>
    );
  }
}
