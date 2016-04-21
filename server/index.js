import express from 'express';
import path from 'path';
import { NotifHandler } from 'hull';
import devMode from './dev-mode';
import _ from 'lodash';
import compute from './compute';
import fetchUser from './middlewares/fetch-user';
import fetchShip from './middlewares/fetch-ship';
import streamExtract from './middlewares/stream-extract';
import bodyParser from 'body-parser';
import Promise from 'bluebird'
import responseTime from 'response-time';

import userUpdate from './user-update';


const notifHandler = NotifHandler({
  groupTraits: false,
  onSubscribe: function() {
    console.warn("Hello new subscriber !");
  },
  events: {
    'user_report:update': userUpdate
  }
});

module.exports = function(port) {

  const app = express();

  app.use(responseTime());

  if (process.env.NODE_ENV !== 'production') {
    app.use(devMode());
  }

  app.use(express.static(path.resolve(__dirname, '..', 'dist')));
  app.use(express.static(path.resolve(__dirname, '..', 'assets')));

  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'manifest.json'));
  });

  app.get('/readme', (req,res) => {
    res.redirect(`https://dashboard.hullapp.io/readme?url=https://${req.headers.host}`);
  });

  app.post('/compute', bodyParser.json(), fetchShip, fetchUser, (req, res) => {
    const { client, ship, user, timings } = req.hull;
    res.type('application/json');
    if (client && ship && user) {
      const { code, save } = req.body;
      if (code) {
        ship.private_settings.code = code;
      }

      const startTime = new Date();
      const result = compute(user, ship, code);

      function done() {
        const took = new Date() - startTime;
        timings.compute = took;
        res.send({ ship, user, result, took, timings });
        res.end();
      }

      if (code && save && _.isEmpty(result.errors)) {
        client.put(ship.id, {
          private_settings: ship.private_settings
        }).then(done, (err) => {
          result.errors = [ err.message ];
          done();
        });
      } else {
        done();
      }
    } else {
      res.status(400);
      res.send({ reason: 'missing_params', message: 'Missing Params' });
      res.end();
    }
  });


  app.post('/batch', bodyParser.json(), fetchShip, streamExtract(userUpdate), (req, res) => {
    res.end('ok')
  });

  app.post('/notify', notifHandler);

  app.listen(port)

  return app;

}
