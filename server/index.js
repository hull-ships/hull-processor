import express from "express";
import path from "path";
import devMode from "./dev-mode";
import ComputeHandler from "./compute-handler";
import responseTime from "response-time";
import updateUser from "./user-update";

module.exports = function Server(options = {}) {
  const { port, Hull, devMode: dev, hostSecret } = options;
  const { BatchHandler, NotifHandler, Routes, Middleware } = Hull;
  const { Readme, Manifest } = Routes;

  const app = express();

  if (dev) app.use(devMode());
  app.use(responseTime());
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  app.set("views", path.resolve(__dirname, "..", "views"));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);


  app.post("/compute", ComputeHandler({ hostSecret, hullClient: Middleware, Hull }));
  app.post("/batch", BatchHandler({
    hostSecret,
    batchSize: 100,
    groupTraits: false,
    handler: (notifications = [], { hull, ship }) => {
      notifications.map(({ message }) => {
        message.user = hull.utils.groupTraits(message.user);
        return updateUser({ message }, { hull, ship });
      });
    }
  }));
  app.post("/notify", NotifHandler({
    hostSecret,
    groupTraits: false,
    onSubscribe() {
      console.warn("Hello new subscriber !");
    },
    handlers: {
      "user:update": updateUser
    }
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
    }

    return res.status(err.status || 500).send({ message: err.message });
  });

  Hull.logger.info("started", { port });

  app.listen(port);

  return app;
};
