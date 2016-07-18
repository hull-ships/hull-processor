const hullClient = require("hull/lib/middleware/client");
const NotifHandler = require("hull/lib/notif-handler");
const BatchHandler = require("hull/lib/batch-handler");

const hullSecret = "hullSecret";
const config = {
  secret: hullSecret,
  organization: "abc.hullapp.dev",
  ship: "56f3d53ef89a8791cb000004"
};

function noop() {}

const Routes = {
  Readme() { return noop; },
  OAuth() { return noop; },
  Manifest() { return noop; }
};

export default function HullSpy(ship, spy) {
  const Hull = function Hull() {
    this.get = (...args) => {
      if (spy) spy("get", ...args);
      return Promise.resolve(ship);
    };
    this.post = (...args) => {
      if (spy) spy("post", ...args);
      return Promise.resolve(ship);
    };
    this.put = (...args) => {
      if (spy) spy("put", ...args);
      return Promise.resolve(ship);
    };
    this.traits = (...args) => {
      if (spy) spy("traits", ...args);
      return Promise.resolve();
    };
    this.track = (...args) => {
      if (spy) spy("track", ...args);
      return Promise.resolve();
    };
    this.as = (...args) => {
      if (spy) spy("as", ...args);
      return new Hull();
    };
    this.logger = {
      info: (...args) => console.log(...args),
      error: (...args) => console.log(...args),
      debug: (...args) => console.log(...args),
      log: (...args) => console.log(...args)
    };
  };

  Hull.Routes = Routes;
  Hull.log = noop;
  Hull.NotifHandler = NotifHandler.bind(undefined, Hull);
  Hull.BatchHandler = BatchHandler.bind(undefined, Hull);
  Hull.Middlewares = { hullClient: hullClient.bind(undefined, Hull) };

  return new Hull(config);
}
