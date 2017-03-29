import { notifHandler, batchHandler } from "hull/lib/utils";
import ComputeHandler from "./compute-handler";
import updateUser from "./user-update";
import devMode from "./dev-mode";

module.exports = function Server(app, options = {}) {
  const { port, Hull, hostSecret, clientConfig = {} } = options;

  const connector = new Hull.Connector({ hostSecret, port, clientConfig });

  app.post("/compute", ComputeHandler({ hostSecret, connector, Hull }));

  if (options.devMode) app.use(devMode());
  connector.setupApp(app);

  app.post("/batch", batchHandler({
    hostSecret,
    batchSize: 100,
    groupTraits: false,
    handler: (notifications = [], { hull, ship }) => {
      hull.logger.debug("processor.batch.process", { notifications: notifications.length });
      notifications.map(({ message }) => {
        message.user = hull.utils.groupTraits(message.user);
        return updateUser({ message }, { hull, ship });
      });
    }
  }));
  app.post("/notify", notifHandler({
    hostSecret,
    groupTraits: true,
    onSubscribe() {
      console.warn("Hello new subscriber !");
    },
    handlers: {
      "user:update": (ctx, messages = []) => {
        return Promise.all(messages.map(message => updateUser({ message }, {
          ship: ctx.ship,
          hull: ctx.client
        })));
      }
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

  Hull.logger.info("processor.started", { port });

  app.listen(port);

  return app;
};
