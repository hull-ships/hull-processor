import express from "express";
import _ from "lodash";
import check from "syntax-error";

import ComputeHandler from "./actions/compute-handler";
import NotifyHandler from "./actions/notify-handler";
import devMode from "./dev-mode";

export default function Server(connector, options = {}) {
  const app = express();
  const { Hull, hostSecret } = options;

  app.post("/compute", ComputeHandler({ hostSecret, connector }));

  if (options.devMode) app.use(devMode());
  connector.setupApp(app);

  app.post("/batch", NotifyHandler);
  app.post("/notify", NotifyHandler);
  app.get("/status", (req, res) => {
    const { ship } = req.hull;
    const messages = [];
    let status = "ok";
    if (!_.get(ship.private_settings, "code")) {
      status = "error";
      messages.push("Settings are empty");
    }

    const err = check(ship.private_settings.code);
    if (err) {
      status = "error";
      messages.push("Settings are referencing invalid values");
    }

    return res.json({ messages, status });
  });

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
