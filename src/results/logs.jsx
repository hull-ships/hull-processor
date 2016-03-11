import React, { Component } from 'react';


export default class LogsPane extends Component {
  render() {
    const { logs } = this.props;

    return <ul>
      {logs.map((line, i) => <li key={`line-${i}`}>{JSON.stringify(line)}</li>)}
    </ul>;
  }
}

