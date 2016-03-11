import React, { Component } from 'react';

export default class TraitsPane extends Component {
  render() {
    return <div className="well">
      <pre>{JSON.stringify(this.props.traits, ' ', 2)}</pre>
    </div>
  }
}

