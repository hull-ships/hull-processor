import React, { Component } from 'react';


export default class ErrorsPane extends Component {
  render() {
    return <div className="well">
      <pre className='text-danger'>
        {JSON.stringify(this.props.errors, ' ', 2)}
      </pre>
    </div>
  }
}

