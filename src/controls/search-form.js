import React, { Component } from 'react';

export default class SearchForm extends Component {

  constructor(props) {
    super(props);
    this.state = { userEmail: props.userEmail };
  }

  handleEmailChange(e) {
    if (e && e.target) {
      this.setState({ userEmail: e.target.value });
    }
  }

  handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.props.onSubmit(this.state.userEmail);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.userEmail && nextProps.userEmail != this.props.userEmail) {
      this.setState({ userEmail });
    }
  }

  render() {
    return <form className="form" onSubmit={this.handleSubmit.bind(this)}>
      <div className="input-group">
        <input type="text" placeholder="Name or Email" value={this.props.userEmail} onChange={this.handleEmailChange.bind(this)} className="form-control form-control" />
        <div className="input-group-btn">
          <a className="btn btn-primary" onClick={this.handleSubmit.bind(this)}>
            Search user
          </a>
        </div>
      </div>
    </form>;
  }
}

