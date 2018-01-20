import PropTypes from "prop-types";
import React, { Component } from "react";
import className from "classnames";

class CodeMirror extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocusChange: PropTypes.func,
    onScroll: PropTypes.func,
    options: PropTypes.object,
    path: PropTypes.string,
    value: PropTypes.string,
    className: PropTypes.any,
    codeMirrorInstance: PropTypes.object
  };

  state = {
    isFocused: false
  };

  componentDidMount() {
    const textareaNode = this.refs.textarea;
    const codeMirrorInstance = this.getCodeMirrorInstance();
    this.codeMirror = codeMirrorInstance.fromTextArea(
      textareaNode,
      this.props.options
    );
    this.codeMirror.on("change", this.codemirrorValueChanged);
    this.codeMirror.on("focus", this.focusChanged.bind(this, true));
    this.codeMirror.on("blur", this.focusChanged.bind(this, false));
    this.codeMirror.on("scroll", this.scrollChanged);
    this.codeMirror.setValue(this.props.defaultValue || this.props.value || "");
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.codeMirror &&
      nextProps.value !== undefined &&
      this.codeMirror.getValue() != nextProps.value
    ) {
      this.codeMirror.setValue(nextProps.value);
    }
    if (typeof nextProps.options === "object") {
      for (const optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.codeMirror.setOption(optionName, nextProps.options[optionName]);
        }
      }
    }
  }

  componentWillUnmount() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  getCodeMirror = () => {
    return this.codeMirror;
  };

  getCodeMirrorInstance = () => {
    if (this.props.codeMirrorInstance) return this.props.codeMirrorInstance;
    const cm = require("codemirror");
    require("codemirror/addon/fold/foldcode");
    require("codemirror/addon/fold/foldgutter");
    require("codemirror/addon/fold/foldgutter.css");
    require("codemirror/addon/fold/brace-fold");
    require("codemirror/addon/fold/indent-fold");
    require("codemirror/addon/fold/comment-fold");
    return cm;
  };

  codemirrorValueChanged = (doc, change) => {
    if (this.props.onChange && change.origin != "setValue") {
      this.props.onChange(doc.getValue());
    }
  };

  focus = () => {
    if (this.codeMirror) {
      this.codeMirror.focus();
    }
  };

  focusChanged = (focused) => {
    this.setState({
      isFocused: focused
    });
    this.props.onFocusChange && this.props.onFocusChange(focused);
  };

  scrollChanged = (cm) => {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  };

  render() {
    const editorClassName = className(
      "ReactCodeMirror",
      this.state.isFocused ? "ReactCodeMirror--focused" : null,
      this.props.className
    );
    return (
      <div className={editorClassName}>
        <textarea
          ref="textarea"
          name={this.props.path}
          defaultValue={this.props.value}
          autoComplete="off"
        />
      </div>
    );
  }
}

module.exports = CodeMirror;
