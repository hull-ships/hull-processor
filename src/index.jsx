import { queryParams } from './utils';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import superagent from 'superagent';
import Promise from 'bluebird';

(function main() {
  const { ship, organization, secret } = queryParams();


  function compute(params, callback) {
    return new Promise( (resolve, reject) => {
      superagent.post('/compute')
        .query({ ship, organization, secret })
        .send(params)
        .accept('json')
        .end((err, result) => {
          err ? reject(err) : resolve(result.body)
        })
    });
  }

  Hull.init({
    appId: ship,
    orgUrl: 'https://' + organization
  });

  Hull.ready((hull, user, app, org) => {
    const root = document.getElementById('app');
    const userId = user && user.id;
    compute({ userId }).then((props) => {
      ReactDOM.render(<App {...props} onCompute={compute} />, root);
    }, (err) => {
      console.warn("Oops terrible error", err);
    });
  });
})();
