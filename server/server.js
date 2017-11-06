import express from "express";

import computeHandler from "./actions/compute-handler";
import notifyHandler from "./actions/notify-handler";
import statusCheck from "./actions/status-check";
import devMode from "./dev-mode";

export default function Server(connector, options = {}) {
  const app = express();
  const { hostSecret } = options;

  app.post("/compute", computeHandler({ hostSecret, connector }));

  if (options.devMode) app.use(devMode());
  connector.setupApp(app);

  app.post("/batch", notifyHandler());
  app.post("/smart-notifier", notifyHandler({
    type: "next",
    size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
    in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 10
  }));
  app.post("/notify", notifyHandler());
  app.all("/status", statusCheck);

  return app;
}
