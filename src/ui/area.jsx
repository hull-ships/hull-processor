import _ from "lodash";
import React, { Component, PropTypes } from "react";
import Codemirror from "./react-codemirror";
import stringify from "json-stable-stringify";

const nop = function nop() { };

export default class Area extends Component {

  static defaultProps = {
    highlight: [],
    onChange: nop,
    wrap: false,
    javascript: true,
    style: {}
  }
  static propTypes = {
    highlight: React.PropTypes.array
  }

  componentDidUpdate() {
    this.props.highlight.length && this.cm && this.cm.addOverlay({token:this.buildHighlighter()})
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { value } = this.props;
    if (value === nextProps.value) return false;
    return true;
  }

  buildHighlighter(){
    const tokens = _.map(this.props.highlight, (t) => `("${t}":)` );
    const rgs = `(${tokens.join("|")})`;
    const rgx = new RegExp(rgs, "gi");

    return function highlighter(stream) {
      // https://codemirror.net/doc/manual.html#token
      // https://codemirror.net/addon/search/search.js
      stream.skipToEnd();
      const match = rgx.exec(stream.string);
      if (match && match.index) return "searching";
      return undefined;
    };
  }
  render() {
    let { wrap, style, onChange, value } = this.props;
    if (typeof value !== "string") value = stringify(value, { space: 2 });

    return (<Codemirror
      style={style}
      ref = { c => this.cm = c && c.getCodeMirror() }
      value={value}
      onChange={onChange}
      options={{
        mode: {
          name: this.props.javascript ? "javascript" : "application/ld+json",
          json: true
        },
        lineWrapping: wrap,
        readOnly: true
      }}
    />);
  }
}
