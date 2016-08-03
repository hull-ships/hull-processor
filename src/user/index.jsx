import React, { Component, PropTypes } from "react";
import SearchForm from "../ui/search-form";
import { Col } from "react-bootstrap";
import Area from "../ui/area";

export default class UserPane extends Component {

  static propTypes = {
    loading: PropTypes.bool.isRequired,
    onSearch: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.object,
    userSearch: PropTypes.string
  }

  render() {
    const { className, sm, md, loading, onSearch, onChange, value, userSearch, error } = this.props;

    const search = value && value.user && value.user.email;

    return <Col className={className} md={md} sm={sm}>
      <SearchForm loading={loading} error={error} userSearch={search} onSubmit={onSearch} />
      <Area value={value} type="info" onChange={onChange} javascript={false}/>
    </Col>;
  }
}
