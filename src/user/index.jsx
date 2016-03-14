import React, { Component, PropTypes } from 'react';
import SearchForm from '../ui/search-form';
import { Col } from 'react-bootstrap';
import Area from '../ui/area';

export default class UserPane extends Component {

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    onSearch: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.string,
    userSearch: PropTypes.string
  }

  render() {
    const { className, sm, loading, onSearch, onChange, value, userSearch } = this.props;
    return <Col className={className} sm={sm}>
      <SearchForm loading={loading} userSearch={userSearch} onSubmit={onSearch} />
      <Area value={value} type='info' onChange={onChange}/>
    </Col>;
  }
}
