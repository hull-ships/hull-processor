import _ from "lodash";
import PropTypes from "prop-types";
import React, { Component } from "react";
import stringify from "json-stable-stringify";
import Codemirror from "./react-codemirror";

const nop = function nop() {};

export default class Area extends Component {
  static defaultProps = {
    highlight: [],
    onChange: nop,
    wrap: false,
    javascript: true,
    style: {}
  };
  static propTypes = {
    highlight: PropTypes.array
  };

  componentDidUpdate() {
    this.props.highlight.length &&
      this.cm &&
      this.cm.addOverlay({ token: this.buildHighlighter() });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { value } = this.props;
    if (value === nextProps.value) return false;
    return true;
  }

  buildHighlighter() {
    const tokens = _.map(this.props.highlight, t => `("${t}":)`);
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
    let {
      wrap, style, onChange, value
    } = this.props;
    if (typeof value !== "string") value = stringify(value, { space: 2 });

    return (
      <Codemirror
        style={style}
        ref={c => (this.cm = c && c.getCodeMirror())}
        value={value}
        onChange={onChange}
        options={{
          mode: {
            name: this.props.javascript ? "javascript" : "application/ld+json",
            json: true
          },
          gutters: [
            "CodeMirror-lint-markers",
            "CodeMirror-linenumbers",
            "CodeMirror-foldgutter"
          ],
          extraKeys: { "Ctrl-Q": cm => cm.foldCode(cm.getCursor()) },
          foldGutter: true,
          lineNumbers: true,
          lineWrapping: wrap,
          readOnly: true
        }}
      />
    );
  }
}
