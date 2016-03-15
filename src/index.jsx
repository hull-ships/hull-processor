import { queryParams } from './utils';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import superagent from 'superagent';
import Promise from 'bluebird';

import Engine from './engine';


(function main() {
  const { ship, organization, secret } = queryParams();

  Hull.init({
    appId: ship,
    orgUrl: 'https://' + organization
  });

  Hull.ready((hull, currentUser, app, org) => {
    const root = document.getElementById('app');
    const engine = new Engine({ ship: ship, organization, secret }, { ship: app, currentUser })

    window.addEventListener('message', function(e) {
      var message = e.data;
      if (message && message.event === 'ship.update' && message.ship) {
        engine.updateShip(message.ship);
      }
    });

    ReactDOM.render(<App engine={engine} />, root);
  });

})();
