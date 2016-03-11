import React, { Component } from 'react';
import Codemirror from 'react-codemirror';

export default class UserPane extends Component {

  render() {
    return <div>
      <Codemirror value={this.props.value}
              onChange={this.props.onChange}
              options={{ mode: 'javascript', readOnly: !!this.props.loading }} />
    </div>;
  }
}
