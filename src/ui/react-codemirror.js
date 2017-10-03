import React from "react";
import className from "classnames";


const CodeMirror = React.createClass({
  propTypes: {
    onChange: React.PropTypes.func,
    onFocusChange: React.PropTypes.func,
    onScroll: React.PropTypes.func,
    options: React.PropTypes.object,
    path: React.PropTypes.string,
    value: React.PropTypes.string,
    className: React.PropTypes.any,
    codeMirrorInstance: React.PropTypes.object,
  },
  getCodeMirrorInstance() {
    if (this.props.codeMirrorInstance) return this.props.codeMirrorInstance;
    const cm = require("codemirror");
    require("codemirror/addon/fold/foldcode");
    require("codemirror/addon/fold/foldgutter");
    require("codemirror/addon/fold/foldgutter.css");
    require("codemirror/addon/fold/brace-fold");
    require("codemirror/addon/fold/indent-fold");
    require("codemirror/addon/fold/comment-fold");
    return cm;
  },
  getInitialState() {
    return {
      isFocused: false,
    };
  },
  componentDidMount() {
    const textareaNode = this.refs.textarea;
    const codeMirrorInstance = this.getCodeMirrorInstance();
    this.codeMirror = codeMirrorInstance.fromTextArea(textareaNode, this.props.options);
    this.codeMirror.on("change", this.codemirrorValueChanged);
    this.codeMirror.on("focus", this.focusChanged.bind(this, true));
    this.codeMirror.on("blur", this.focusChanged.bind(this, false));
    this.codeMirror.on("scroll", this.scrollChanged);
    this.codeMirror.setValue(this.props.defaultValue || this.props.value || "");
  },
  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  },

  componentWillReceiveProps(nextProps) {
    if (this.codeMirror && nextProps.value !== undefined && this.codeMirror.getValue() != nextProps.value) {
      this.codeMirror.setValue(nextProps.value);
    }
    if (typeof nextProps.options === "object") {
      for (let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.codeMirror.setOption(optionName, nextProps.options[optionName]);
        }
      }
    }
  },

  getCodeMirror() {
    return this.codeMirror;
  },
  focus() {
    if (this.codeMirror) {
      this.codeMirror.focus();
    }
  },
  focusChanged(focused) {
    this.setState({
      isFocused: focused,
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  },
  scrollChanged(cm) {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  },
  codemirrorValueChanged(doc, change) {
    if (this.props.onChange && change.origin != "setValue") {
      this.props.onChange(doc.getValue());
    }
  },
  render() {
    const editorClassName = className(
      "ReactCodeMirror",
      this.state.isFocused ? "ReactCodeMirror--focused" : null,
      this.props.className
    );
    return (
      <div className={editorClassName}>
        <textarea ref="textarea" name={this.props.path} defaultValue={this.props.value} autoComplete="off" />
      </div>
    );
  },
});

module.exports = CodeMirror;
