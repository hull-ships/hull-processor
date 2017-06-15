import express from "express";

import ComputeHandler from "./actions/compute-handler";
import NotifyHandler from "./actions/notify-handler";
import devMode from "./dev-mode";

module.exports = function Server(connector, options = {}) {
  const app = express();
  const { Hull, hostSecret } = options;

  app.post("/compute", ComputeHandler({ hostSecret, connector, Hull }));

  if (options.devMode) app.use(devMode());
  connector.setupApp(app);

  app.post("/batch", NotifyHandler(hostSecret));
  app.post("/notify", NotifyHandler(hostSecret));

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
    }

    return res.status(err.status || 500).send({ message: err.message });
  });

  return app;
};
