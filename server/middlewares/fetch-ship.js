import hullClientMiddleware from './hull-client';

export default function fetchShip(req, res, next) {
  req.hull = req.hull || { timings: {} };
  if (req.body.ship && req.body.ship.private_settings) {
    req.hull.ship = req.body.ship;
  }

  return hullClientMiddleware({
    useCache: true,
    fetchShip: !req.hull.ship
  })(req, res, next);
}
