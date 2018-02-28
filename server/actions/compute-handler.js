const connect = require("connect");
const bodyParser = require("body-parser");
const timeout = require("connect-timeout");
const _ = require("lodash");

const compute = require("../lib/compute");
const lint = require("../lib/utils/lint-code");
const syntaxCheck = require("../lib/utils/syntax-check");
const fetchUser = require("../middlewares/fetch-user");

function computeHandler(req, res) {
  const { client, timings } = req.hull;
  let { ship = {}, payload } = req.body;
  // This condition ensures boot request does work:
  // When loading the page, the ship is client-side so what's passed to remote
  // doesn't have private_settings embedded
  ship = ship.private_settings ? ship : req.hull.ship;
  payload = payload || req.hull.user;

  res.type("application/json");

  if (client && ship && payload) {
    const startTime = new Date();
    compute(payload, ship, {
      preview: true,
      logger: req.hull.client.asUser(payload.user).logger
    })
      .then((result) => {
        const { logsForLogger } = result;
        if (logsForLogger && logsForLogger.length) {
          logsForLogger.map(line =>
            req.hull.client.logger.debug("preview.console.log", line));
        }
        const took = new Date() - startTime;
        const err = syntaxCheck(ship.private_settings.code);
        if (err) {
          result.errors.push(err.annotated);
        } else {
          const linter = lint(ship.private_settings.code);
          if (linter.length) result.errors.push(...linter);
        }
        timings.compute = took;
        res
          .send({
            ship,
            payload,
            took,
            timings,
            result: _.omit(result, "user", "account")
          })
          .end();
      })
      .catch(error => res.status(500).json({ error }));
  } else {
    res
      .status(400)
      .json({ reason: "missing_params", message: "Missing Params" });
  }
}

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}

module.exports = function ComputeHandler(options) {
  const app = connect();
  const { connector, hostSecret = "" } = options;

  app.use(timeout("28s"));
  app.use(bodyParser.json());
  app.use(haltOnTimedout);
  app.use(connector.clientMiddleware({
    hostSecret,
    fetchShip: true,
    cacheShip: false
  }));
  app.use(fetchUser);
  app.use(haltOnTimedout);
  app.use(computeHandler);
  app.use(haltOnTimedout);

  return function c(req, res) {
    return app.handle(req, res);
  };
};
