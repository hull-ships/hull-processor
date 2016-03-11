import React, { Component } from 'react';

export default class SearchForm extends Component {

  constructor(props) {
    super(props);
    this.state = { userSearch: props.userSearch };
  }

  handleEmailChange(e) {
    if (e && e.target) {
      this.setState({ userSearch: e.target.value });
    }
  }

  handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.props.onSubmit(this.state.userSearch);
  }

  componentWillReceiveProps(nextProps) {
    const { userSearch } = nextProps;
    if (userSearch && userSearch != this.props.userSearch) {
      this.setState({ userSearch });
    }
  }

  render() {
    return <form className="form" onSubmit={this.handleSubmit.bind(this)}>
      <div className="input-group">
        <input type="text" placeholder="Name or Email" value={this.state.userSearch} onChange={this.handleEmailChange.bind(this)} className="form-control form-control" />
        <div className="input-group-btn">
          <a className="btn btn-primary" onClick={this.handleSubmit.bind(this)}>
            Search user
          </a>
        </div>
      </div>
    </form>;
  }
}

