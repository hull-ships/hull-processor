import connect from "connect";
import compute from "../compute";
import bodyParser from "body-parser";
import timeout from "connect-timeout";
import fetchUser from "../middlewares/fetch-user";

function computeHandler(req, res) {
  const { client, timings } = req.hull;
  let { ship = {}, user } = req.body;
  // This condition ensures boot request does work:
  // When loading the page, the ship is client-side so what's passed to remote
  // doesn't have private_settings embedded
  ship = (ship.private_settings) ? ship : req.hull.ship;
  user = user || req.hull.user;

  res.type("application/json");

  if (client && ship && user) {
    const startTime = new Date();
    compute(user, ship, { preview: true })
    .then(result => {
      const logsForLogger = result.logsForLogger;
      if (logsForLogger && logsForLogger.length) {
        logsForLogger.map(line => req.hull.client.logger.debug("preview.console.log", line));
      }
      const took = new Date() - startTime;
      timings.compute = took;
      res.send({ ship, user, took, timings, result })
        .end();
    }).catch(error => res.status(500).json({ error }));
  } else {
    res
      .status(400)
      .json({ reason: "missing_params", message: "Missing Params" });
  }
}

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}

export default function ComputeHandler(options) {
  const app = connect();
  const { connector, hostSecret = "" } = options;

  app.use(timeout("28s"));
  app.use(bodyParser.json());
  app.use(haltOnTimedout);
  app.use(connector.clientMiddleware({ hostSecret, fetchShip: true, cacheShip: false }));
  app.use(fetchUser);
  app.use(haltOnTimedout);
  app.use(computeHandler);
  app.use(haltOnTimedout);

  return function c(req, res) {
    return app.handle(req, res);
  };
}
