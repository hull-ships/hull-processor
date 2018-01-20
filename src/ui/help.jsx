import React, { Component } from "react";

export default class Help extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return <a href='/readme' target="_blank" bsStyle="warning" bsSize="sm" className='btn-pill btn-rounded'>Documentation</a>;
  }
}
