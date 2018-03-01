const express = require("express");
const compression = require("compression");

const actions = require("./actions");
const devModeMiddleware = require("./lib/utils/dev-mode");

function server(connector, options = {}) {
  const app = express();
  app.use(compression());
  const { hostSecret } = options;

  app.post("/compute", actions.compute({ hostSecret, connector }));

  if (options.devMode) app.use(devModeMiddleware());
  connector.setupApp(app);

  app.post("/batch", actions.notify());
  app.post("/smart-notifier", actions.notify({
    type: "next",
    size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
    in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10
  }));
  app.post("/notify", actions.notify());
  app.all("/status", actions.statusCheck);

  return app;
}

module.exports = server;
