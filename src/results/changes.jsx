import React, { Component } from 'react';


export default class ChangesPane extends Component {
  render() {
    return <div className="well">
      <pre>{JSON.stringify(this.props.changes, ' ', 2)}</pre>
    </div>;
  }
}

