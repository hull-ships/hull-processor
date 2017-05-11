import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import raven from "raven";
import deepDiff from "deep-diff";
import deepFreeze from "deep-freeze";
import deepMerge from "deepmerge";
import Hull from "hull";
// import isGroup from "./is-group-trait";

function applyUtils(sandbox = {}) {
  const lodash = _.functions(_).reduce((l, key) => {
    l[key] = (...args) => _[key](...args);
    return l;
  }, {});

  sandbox.moment = deepFreeze((...args) => { return moment(...args); });
  sandbox.urijs = deepFreeze((...args) => { return urijs(...args); });
  sandbox._ = deepFreeze(lodash);
}

function isInSegment(segments = [], segmentName) {
  return _.includes(_.map(segments, "name"), segmentName);
}

const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}
const TOP_LEVEL_FIELDS = ["tags", "name", "description", "extra", "picture", "settings", "username", "email", "contact_email", "image", "first_name", "last_name", "address", "created_at", "phone", "domain", "accepts_marketing"];

module.exports = function compute({ changes = {}, user, segments, events = [] }, ship = {}) {
  const { private_settings = {} } = ship;
  const { code = "", sentry_dsn: sentryDsn } = private_settings;

  // Manually add traits hash if not already there
  user.traits = user.traits || {};

  const sandbox = getSandbox(ship);
  sandbox.changes = changes;
  sandbox.user = user;
  sandbox.events = events;
  sandbox.segments = segments;
  sandbox.ship = ship;
  sandbox.payload = {};
  sandbox.isInSegment = isInSegment.bind(null, segments);
  sandbox.Hull = Hull;
  applyUtils(sandbox);

  let tracks = [];
  const userTraits = [];
  const logs = [];
  const errors = [];

  sandbox.errors = errors;
  sandbox.logs = logs;
  sandbox.track = (eventName, properties = {}, context = {}) => {
    if (eventName) tracks.push({ eventName, properties, context });
  };
  sandbox.traits = (properties = {}, context = {}) => {
    userTraits.push({ properties, context });
  };

  function log(...args) {
    logs.push(args);
  }
  function logError(...args) {
    errors.push(args);
  }
  sandbox.console = { log, warn: log, error: logError };

  sandbox.captureException = function captureException(e) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.setExtraContext({ user, segments, events });
      client.captureException(e);
    }
  };

  sandbox.captureMessage = function captureMessage(msg) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.captureMessage(msg);
    }
  };

  try {
    const script = new vm.Script(`
      try {
        (function() {
          "use strict";
          ${code}
        }());
      } catch (err) {
        errors.push(err.toString());
        captureException(err);
      }`);
    script.runInContext(sandbox);
  } catch (err) {
    errors.push(err.toString());
    sandbox.captureException(err);
  }

  if (tracks.length > 10) {
    logs.unshift([tracks]);
    logs.unshift([`You're trying to send ${tracks.length} calls at a time. We will only process the first 10`]);
    logs.unshift(["You can't send more than 10 tracking calls in one batch."]);
    tracks = _.slice(tracks, 0, 10);
  }


  const payload = _.reduce(userTraits, (pld, pl = {}) => {
    const { properties, context = {} } = pl;
    if (properties) {
      const { source } = context;
      if (source) {
        pld[source] = { ...pld[source], ...properties };
      } else {
        _.map(properties, (v, k) => {
          const path = k.replace("/", ".");
          if (path.indexOf(".") > -1) {
            _.setWith(pld, path, v, Object);
          } else if (_.includes(TOP_LEVEL_FIELDS, k)) {
            pld[k] = v;
          } else {
            pld.traits = {
              ...pld.traits,
              [k]: v
            };
          }
          return;
        });
      }
    }
    return pld;
  }, {});

  const updatedUser = deepMerge(user, payload, {
    // we don't concatenate arrays, we use only new values:
    arrayMerge: (destinationArray, sourceArray) => sourceArray
  });

  const diff = deepDiff(user, updatedUser) || [];
  const changed = _.reduce(diff, (memo, d) => {
    if (d.kind === "N" || d.kind === "E") {
      _.set(memo, d.path, d.rhs);
    }
    // when we have an array updated we set the whole
    // array in `changed` constant
    if (d.kind === "A") {
      _.set(memo, d.path, _.get(payload, d.path, []));
    }
    return memo;
  }, {});

  return {
    logs,
    errors,
    changes: changed,
    events: tracks,
    payload: sandbox.payload,
    user: updatedUser
  };
};
