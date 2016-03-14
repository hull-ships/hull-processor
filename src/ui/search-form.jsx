import React, { Component } from 'react';
 import Icon from './icon';

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
    const { loading } = this.props;

    return <form className="form form-light mt-05 mb-05" onSubmit={this.handleSubmit.bind(this)}>
      <div className="input-group">
        <div className="input-group-addon" style={{textTransform:'none', background: 'none'}}>
          <h4 className="m-0 text-muted">Input</h4>
        </div>
        <input type="text" placeholder="Name or Email" value={this.state.userSearch} onChange={this.handleEmailChange.bind(this)} className="form-control form-control-sm" />
        <div className="input-group-btn">
          <a className="" href='#' className='text-muted mt-05 mb-05' onClick={this.handleSubmit.bind(this)}>
          <Icon name={loading ? 'spinner' : 'search'}/> <strong>Search</strong>
          </a>
        </div>
      </div>
    </form>;
  }
}
