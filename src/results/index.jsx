import React, { Component } from 'react';
import _ from 'lodash';
import { Tabs, Tab } from 'react-bootstrap';

import Changes from './changes';
import Errors from './errors';
import Logs from './logs';
import Traits from './traits';

const Panes = {
  Changes, Traits, Errors, Logs
}

export default class Results extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  getActiveTabs() {
    return Object.keys(Panes).reduce( (res, key) => {
      const data = this.props[key.toLowerCase()];
      const Pane = Panes[key];
      if (Pane && !_.isEmpty(data)) {
        res.defaultKey = res.defaultKey || key;
        res.activeKeys[key] = true;
        const badge = data.length > 0 ? ` (${data.length})` : '';
        res.tabs.push(<Tab eventKey={key} key={key} title={key}>
          <Pane {...this.props} />
        </Tab>);
      }
      return res;
    }, { tabs: [], activeKeys: {}, defaultKey: null });
  }

  handleSwitchTab(activeKey) {
    this.setState({ activeKey });
  }

  render() {
    const { tabs, activeKeys, defaultKey } = this.getActiveTabs();
    const activeKey = activeKeys[this.state.activeKey] ? this.state.activeKey : defaultKey;
    return <Tabs justified activeKey={activeKey} onSelect={this.handleSwitchTab.bind(this)}>
      {tabs}
    </Tabs>;
  }

}
