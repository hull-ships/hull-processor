import express from 'express';
import path from 'path';
import { NotifHandler } from 'hull';
import devMode from './dev-mode';
import _ from 'lodash';
import compute from './compute';
import hullClientMiddleware from './middlewares/hull-client';
import bodyParser from 'body-parser';
import Promise from 'bluebird'

function handle({ message }, { ship, hull }) {
  const { user, segments } = message;
  const { changes } = compute(message, ship);

  if (!_.isEmpty(changes)) {
    hull.as(user.id).traits(changes).then((res) => {
      console.warn("CHANGES ", res)
    });
  } else {
    console.warn("Nothing changed !");
  }
}

const notifHandler = NotifHandler({
  onSubscribe: function() {
    console.warn("Hello new subscriber !");
  },
  events: {
    'user_report:update': handle
  }
});

function fetchUser(req, res, next) {
  req.hull = req.hull || {};
  const { client, ship } = req.hull;
  let { userId, userSearch, user } = req.body || {};

  if (!user && client) {
    let userPromise;

    if (userId) {
      console.warn("Getting user with ID", userId)
      userPromise = client.get(userId + '/user_report')
    } else {

      const params = {
        query: {
          match_all: {}
        },
        raw: true,
        page: 1,
        per_page: 1
      };

      if (userSearch) {
        params.query = { multi_match: {
          query: userSearch,
          fields: ["name", "name.exact", "email", "email.exact", "contact_email", "contact_email.exact"]
        } };
      }

      console.warn("Searching user with email", {userSearch, params: JSON.stringify(params)})

      userPromise = client.post('search/user_reports', params).then(res => {
        return res.data[0];
      }, (err) => {
        console.warn("Oooula", err);
        throw err;
      })
    }

    userPromise.then((user) => {
      return client.get(user.id + '/segments').then((segments) => {
        console.warn("And his segments: ", segments)
        req.hull.user = { user, segments };
        next();
      }, err => {
        console.warn("Oupla. pas de segments ?", err)
        next();
      })
    }).catch((err) => {
      console.warn('oopss', err);
      next()
    });

 } else {
    if (user) {
      req.hull.user = user
    }
    next();
  }
}

function fetchShip(req, res, next) {
  req.hull = req.hull || {};
  if (req.body.ship && req.body.ship.private_settings) {
    req.hull.ship = req.body.ship;
  }

  return hullClientMiddleware({
    useCache: false,
    fetchShip: !req.hull.ship
  })(req, res, next);
}


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
