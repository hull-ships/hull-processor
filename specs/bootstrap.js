const Hull = require("hull");
const server = require("../server/server").default;

module.exports = function bootstrap() {
  const hostSecret = "1234";
  const connector = new Hull.Connector({ hostSecret, port: 8000, clientConfig: { protocol: "http" } });
  const app = server(connector, {
    Hull,
    hostSecret
  });

  return connector.startApp(app);
};
