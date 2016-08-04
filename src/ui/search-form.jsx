import React, { Component } from "react";
import Icon from "./icon";
import { Button } from "react-bootstrap";

export default class SearchForm extends Component {

  constructor(props) {
    super(props);
    this.state = { userSearch: props.userSearch, dirty: false };
  }

  handleEmailChange(e) {
    if (e && e.target) {
      this.setState({ userSearch: e.target.value, dirty: true });
    }
  }

  handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.props.onSubmit(this.state.userSearch);
  }

  componentWillReceiveProps(nextProps) {
    const { userSearch } = nextProps;
    const state = { dirty: false };
    if (userSearch && userSearch !== this.props.userSearch) {
      state.userSearch = userSearch;
    }
    this.setState(state);
  }

  getIcon() {
    const { loading, error } = this.props;
    const { dirty } = this.state;
    if (loading) return "spinner";
    if (!dirty && error && error.reason === "user_not_found") return "cross";
    if (!dirty) return "valid";
    return "search";
  }

  render() {
    const { loading } = this.props;

    return <form className="form form-light mt-05 mb-05" onSubmit={this.handleSubmit.bind(this)}>
      <div className="input-group">
        <div className="input-group-addon" style={{ textTransform: "none", background: "none" }}>
          <h4 className="m-0 text-muted">Search</h4>
        </div>
        <input type="text" placeholder="Name or Email" value={this.state.userSearch} onChange={this.handleEmailChange.bind(this)} className="form-control form-control-sm" />
        <div style={{ position: "absolute", right: 0, top: -10, zIndex: 2 }}>
          <Button bsStyle={ loading ? "warning" : "default" } bsSize="sm" clasName='btn-pill btn-rounded' onClick={this.handleSubmit.bind(this)} > <Icon name={this.getIcon()} /> { loading ? "Loading" : "Search" } </Button>
        </div>
      </div>
    </form>;
  }
}
