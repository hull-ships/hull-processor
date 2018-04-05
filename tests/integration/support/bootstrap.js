const Hull = require("hull");
const server = require("../../../server/server");

module.exports = function bootstrap(timeout = 25000) {
  const hostSecret = "1234";
  const connector = new Hull.Connector({
    hostSecret, port: 8000, skipSignatureValidation: true, timeout, clientConfig: { protocol: "http", firehoseUrl: "firehose" }
  });
  const app = server(connector, {
    Hull,
    hostSecret
  });

  return connector.startApp(app);
};
