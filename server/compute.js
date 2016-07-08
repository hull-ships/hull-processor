import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import raven from "raven";
import deepDiff from "deep-diff";
import deepFreeze from "deep-freeze";
import deepMerge from "deepmerge";
// import isGroup from "./is-group-trait";

function applyUtils(sandbox = {}) {
  const lodash = _.functions(_).reduce(function (l, key) { // eslint-disable-line func-names
    l[key] = function () { // eslint-disable-line func-names
      return _[key].apply(undefined, arguments); // eslint-disable-line prefer-rest-params
    };
    return l;
  }, {});

  sandbox.moment = deepFreeze(function () { return moment.apply(undefined, arguments); });  // eslint-disable-line prefer-rest-params, func-names
  sandbox.urijs = deepFreeze(function () { return urijs.apply(undefined, arguments); });  // eslint-disable-line prefer-rest-params, func-names
  sandbox._ = deepFreeze(lodash);
}

function isInSegment(segments, segmentName) {
  return _.includes(_.map(segments, "name"), segmentName);
  // return segments && segments.reduce((r, s) => { return r || s.name == segmentName }, false)
}

const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}

module.exports = function compute({ user, segments, events = [] }, ship = {}) {
  const { private_settings = {} } = ship;
  const { code = "return {};", sentry_dsn: sentryDsn } = private_settings;

  const sandbox = getSandbox(ship);
  sandbox.user = user;
  sandbox.events = events;
  sandbox.segments = segments;
  sandbox.ship = ship;
  sandbox.payload = {};
  sandbox.isInSegment = isInSegment.bind(null, segments);
  applyUtils(sandbox);

  let tracks = [];
  const traits = [];
  const logs = [];
  const errors = [];

  sandbox.errors = errors;
  sandbox.logs = logs;
  sandbox.track = (eventName, properties = {}, context = {}) => {
    if (eventName) tracks.push({ eventName, properties, context });
  };
  sandbox.traits = (properties = {}, context = {}) => {
    traits.push({ properties, context });
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

  const payload = _.reduce(traits, (pld, pl = {}) => {
    const { properties, context = {} } = pl;
    if (!properties) return pld;
    const { source } = context;
    if (source) {
      pld[source] = { ...pld[source], ...properties };
    } else {
      pld.traits = { ...pld.traits, ...properties };
    }
    return pld;
  }, {});

  const updatedUser = deepMerge(user, payload);

  const diff = deepDiff(user, updatedUser) || [];
  const changes = _.reduce(diff, (memo, d) => {
    if (d.kind === "N" || d.kind === "E") {
      _.set(memo, d.path, d.rhs);
    }
    return memo;
  }, {});


  return {
    code,
    result: {
      logs, errors, changes, events: tracks,
      payload: sandbox.payload,
      user: updatedUser
    }
  };
};
