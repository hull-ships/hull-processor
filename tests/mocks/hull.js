import { notifHandler, batchHandler } from "hull/lib/utils";

const hullSecret = "hullSecret";
const config = {
  secret: hullSecret,
  organization: "abc.hullapp.dev",
  ship: "56f3d53ef89a8791cb000004"
};

function noop() {}

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
    this.asUser = (...args) => {
      if (spy) {
        spy("asUser", ...args);
      }
      return new Hull();
    };
    this.account = (...args) => {
      if (spy) spy("account", ...args);
      return new Hull();
    };
    this.logger = {
      info: (...args) => {
        if (spy) spy("logger.info", ...args);
        console.log(...args);
      },
      error: (...args) => {
        if (spy) spy("logger.error", ...args);
        console.log(...args);
      },
      debug: (...args) => {
        if (spy) spy("logger.debug", ...args);
        console.log(...args);
      },
      log: (...args) => {
        if (spy) spy("logger.log", ...args);
        console.log(...args);
      }
    };
  };

  Hull.log = noop;
  Hull.notifHandler = notifHandler.bind(undefined, Hull);
  Hull.batchHandler = batchHandler.bind(undefined, Hull);

  return new Hull(config);
}
