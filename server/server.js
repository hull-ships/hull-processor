import express from "express";

import ComputeHandler from "./actions/compute-handler";
import NotifyHandler from "./actions/notify-handler";
import devMode from "./dev-mode";

export default function Server(connector, options = {}) {
  const app = express();
  const { Hull, hostSecret } = options;

  console.log("Server setup");

  app.post("/compute", ComputeHandler({ hostSecret, connector }));

  if (options.devMode) app.use(devMode());
  connector.setupApp(app);

  app.post("/batch", NotifyHandler());
  app.post("/notify", NotifyHandler({
    type: "next",
    size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 10,
    in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1000
  }));

  // Error Handler
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err) {
      const data = {
        status: err.status,
        segmentBody: req.segment,
        method: req.method,
        headers: req.headers,
        url: req.url,
        params: req.params
      };
      Hull.logger.error("Error ----------------", err.message, err.status, data);
      return res.status(err.status || 500).send({ message: err.message });
    }
    return res.status(err.status || 500).send({ message: "undefined error" });
  });
  return app;
}
