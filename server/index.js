import express from 'express';
import path from 'path';
import { NotifHandler } from 'hull';
import devMode from './dev-mode';
import _ from 'lodash';
import compute from './compute';
import fetchUser from './middlewares/fetch-user';
import fetchShip from './middlewares/fetch-ship';
import bodyParser from 'body-parser';
import Promise from 'bluebird'

const notifHandler = NotifHandler({
  onSubscribe: function() {
    console.warn("Hello new subscriber !");
  },
  events: {
    'user_report:update': require('./user-update')
  }
});

module.exports = function(port) {

  const app = express();

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
    const { client, ship, user } = req.hull;
    res.type('application/json');
    if (client && ship && user) {
      const result = compute(user, ship, req.body.code);
      res.send({ body: req.body, ship, user, result });
      res.end();
    } else {
      res.status(400);
      res.end('');
    }
  });

  app.post('/notify', notifHandler);

  app.listen(port)

  return app;

}
