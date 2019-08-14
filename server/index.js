const redisStore = require("cache-manager-redis");

const Hull = require("hull");
const { Cache } = require("hull/lib/infra");

const server = require("./server");

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Hull.logger.transports.console.json = true;

Hull.logger.info(`Memory Available: ${process.env.MEMORY_AVAILABLE}`);
Hull.logger.info(`Web Memory: ${process.env.WEB_MEMORY}`);
Hull.logger.info(`Web Concurrency: ${process.env.WEB_CONCURRENCY}`);

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_HOST) {
  const { Logstash } = require("winston-logstash"); // eslint-disable-line global-require
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
  debug: process.env.DEBUG,
  port: process.env.PORT || 8082,
  Hull,
  clientConfig: {
    firehoseUrl: process.env.OVERRIDE_FIREHOSE_URL
  },
  cache
};

const connector = new Hull.Connector(options);
const app = server(connector, options);
connector.startApp(app);

Hull.logger.debug("processor.started", { port: options.port });
