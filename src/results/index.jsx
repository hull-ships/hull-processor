import React, { Component } from 'react';
import _ from 'lodash';
import { Tabs, Tab } from 'react-bootstrap';

import Changes from './changes';
import Errors from './errors';
import Logs from './logs';
import Traits from './traits';

const Panes = [
  { key: 'User', Pane: Changes, title: 'User' },
  { key: 'Traits', Pane: Traits, title: 'Output' },
  { key: 'Errors', Pane: Errors, title: 'Errors' },
  { key: 'Logs', Pane: Logs, title: 'Logs' },
];

export default class Results extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  getActiveTabs() {
    return Panes.reduce( (res, pane) => {
      const { Pane, key, title } = pane;
      const data = this.props[key.toLowerCase()];
      if (Pane && !_.isEmpty(data)) {
        res.defaultKey = res.defaultKey || key;
        res.activeKeys[key] = true;
        res.tabs.push(<Tab eventKey={key} key={key} title={title}>
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
