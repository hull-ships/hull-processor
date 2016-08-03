if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.warn("Starting newrelic agent with key: ", process.env.NEW_RELIC_LICENSE_KEY);
  require("newrelic"); // eslint-disable-line global-require
}

const Hull = require("hull");
const Server = require("./server");
const Logstash = require("winston-logstash").Logstash;

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

Hull.logger.add(Logstash, {
  node_name: "processor",
  port: process.env.LOGSTASH_PORT,
  host: process.env.LOGSTASH_HOST
});

console.log(process.env.LOGSTASH_HOST, process.env.LOGSTASH_PORT);
Hull.logger.info("Booting");

Server({
  Hull,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
