import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import Codemirror from 'react-codemirror';

const nop = function(){}


// token: function(stream) {
//   query.lastIndex = stream.pos;
//   var match = query.exec(stream.string);
//   if (match && match.index == stream.pos) {
//     stream.pos += match[0].length || 1;
//     return "searching";
//   } else if (match) {
//     stream.pos = match.index;
//   } else {
//     stream.skipToEnd();
//   }
// }

export default class Area extends Component {

  static defaultProps = {
    highlight: []
  }
  static propTypes = {
    highlight: React.PropTypes.array
  }

  componentDidMount() {
    this.props.highlight.length && this.cm && this.cm.addOverlay({token:this.buildHighlighter()})
  }
  buildHighlighter(){
    const tokens = _.map(this.props.highlight, (t) => `("${t}":)` );
    const rgs = `(${tokens.join('|')})`;
    const rgx = new RegExp(rgs, 'gi');

    return function(stream){
      // https://codemirror.net/doc/manual.html#token
      // https://codemirror.net/addon/search/search.js
      stream.skipToEnd();
      const match = rgx.exec(stream.string);
      if(match && match.index) {
        return "searching";
      }
    }
  }
  render(){
    let {onChange=nop, type='muted', value} = this.props;
    if(typeof value !== 'string') {
      value = JSON.stringify(value, null, 2);
    }
    return <Codemirror
      ref = {(c)=> this.cm = c && c.getCodeMirror() }
      value={value}
      onChange={onChange}
      options={{
        mode: {
          name: 'javascript', json: true
        },
        readOnly: true
      }}
    />
  }
}
