import React, { Component } from "react";

export default class Help extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return <a href='/readme' target="_blank" className='btn-sm btn-pill btn-rounded btn-warning'>Documentation</a>;
  }
}
