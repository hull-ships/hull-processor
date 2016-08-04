if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic"); // eslint-disable-line global-require
}

const Hull = require("hull");
const Server = require("./server");

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Server({
  Hull,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
