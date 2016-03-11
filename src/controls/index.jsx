import React, { Component } from 'react';
import SearchForm from './search-form';
import { Button, Grid, Row, Col } from 'react-bootstrap';

export default class Controls extends Component {

  handleSearch(userEmail) {
    if (userEmail && !this.props.loading) {
      this.props.onRun({ userEmail });
    }
  }

  handleRun(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.props.onRun();
  }

  render() {

    const { loading, onRun, userEmail } = this.props;

    return (
      <Row>
        <Col md={4}><SearchForm loading={loading} userEmail={userEmail} onSubmit={this.handleSearch.bind(this)} /></Col>
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
