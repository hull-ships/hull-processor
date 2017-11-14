import React, { Component } from "react";

export default class Help extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <a href='/readme' target="_blank" bsStyle="warning" bsSize="sm" clasName='btn-pill btn-rounded' onClick={this.open.bind(this)} >Documentation</a>
      </div>
    );
  }
}
