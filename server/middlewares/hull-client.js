import Hull from 'hull';

export default function (options) {
  var _cache = [];

  function getCurrentShip(shipId, client, forceUpdate) {
    if (options.useCache) {
      if (forceUpdate) _cache[shipId] = null;
      _cache[shipId] = _cache[shipId] || client.get(shipId);
      return _cache[shipId];
    } else {
      return client.get(shipId);
    }
  }

  function parseConfig(query) {
    return ['organization', 'ship', 'secret'].reduce((cfg, k)=> {
      const val = query[k];
      if (typeof val === 'string') {
        cfg[k] = val;
      } else if (val && val.length) {
        cfg[k] = val[0];
      }

      if (typeof cfg[k] === 'string') {
        cfg[k] = cfg[k].trim();
      }

      return cfg;
    }, {});
  }

  return function(req, res, next) {
    req.hull = req.hull || {};

    const config = parseConfig(req.query);

    let forceShipUpdate = false;

    if (config.organization && config.ship && config.secret) {
      const client = req.hull.client = new Hull({
        id: config.ship,
        organization: config.organization,
        secret: config.secret
      });
      if (options.fetchShip) {
        getCurrentShip(config.ship, client, forceShipUpdate).then((ship) => {
          req.hull.ship = ship;
          next();
        }, (err) => {
          res.status(404);
          res.end('Error:' + err.toString());
        });
      } else {
        next();
      }
    } else {
      next();
    }
  };
}
