import Hull from "hull";
import { Cache } from "hull/lib/infra";
import redisStore from "cache-manager-redis";
import server from "./server";
require('dotenv').config() // Loads .env
require('@google-cloud/debug-agent').start();

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_HOST) {
  const Logstash = require("winston-logstash").Logstash; // eslint-disable-line global-require
  Hull.logger.add(Logstash, {
    node_name: "processor",
    port: process.env.LOGSTASH_PORT,
    host: process.env.LOGSTASH_HOST
  });
}

// https://www.npmjs.com/package/express-winston

Hull.logger.debug("processor.boot");

let cache;

if (process.env.REDIS_URL) {
  cache = new Cache({
    store: redisStore,
    url: process.env.REDIS_URL,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
} else {
  cache = new Cache({
    store: "memory",
    max: process.env.SHIP_CACHE_MAX || 100,
    ttl: process.env.SHIP_CACHE_TTL || 60
  });
}

const options = {
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082,
  Hull,
  skipSignatureValidation: true,
  clientConfig: {
    firehoseUrl: process.env.OVERRIDE_FIREHOSE_URL
  },
  cache
};

const connector = new Hull.Connector(options);
const app = server(connector, options);
connector.startApp(app);

Hull.logger.debug("processor.started", { port: options.port });
