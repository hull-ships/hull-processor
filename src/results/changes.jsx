import React, { Component } from 'react';
import _ from 'lodash';

export default class ChangesPane extends Component {

  render() {
    const changedTraits = _.reduce(this.props.changes, (t, v,k) => {
      t[`traits_${k}`] = v
      return t;
    }, {});

    const output = _.extend({}, this.props.user, changedTraits);

    return <div className="well">
      <pre>{JSON.stringify(output, ' ', 2)}</pre>
    </div>;
  }
}

