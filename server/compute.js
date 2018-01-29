import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import raven from "raven";
import deepDiff from "deep-diff";
import deepFreeze from "deep-freeze";
import deepMerge from "deepmerge";
import request from "request";
import Promise from "bluebird";

import emailDomains from "./email-domains";

const TOP_LEVEL_FIELDS = [
  "tags",
  "name",
  "description",
  "extra",
  "picture",
  "settings",
  "username",
  "email",
  "contact_email",
  "image",
  "first_name",
  "last_name",
  "address",
  "created_at",
  "phone",
  "domain",
  "accepts_marketing"
];

const lodash = _.functions(_).reduce((l, key) => {
  l[key] = (...args) => _[key](...args);
  return l;
}, {});

const frozenMoment = deepFreeze((...args) => {
  return moment(...args);
});
const frozenUrijs = deepFreeze((...args) => {
  return urijs(...args);
});
const frozenLodash = deepFreeze(lodash);

function applyUtils(sandbox = {}) {
  sandbox.moment = frozenMoment;
  sandbox.urijs = frozenUrijs;
  sandbox._ = frozenLodash;
}

const buildPayload = (pld, traitsCall = {}) => {
  const { properties, context = {} } = traitsCall;
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
      });
    }
  }
  return pld;
};

const buildAccountPayload = (pld, traitsCall = {}) => {
  const { properties, context = {} } = traitsCall;
  if (properties) {
    const { source } = context;
    if (source) {
      pld[source] = { ...pld[source], ...properties };
    } else {
      _.map(properties, function applyTraits(v, k) {
        pld[k] = v;
      });
    }
  }
  return pld;
};

const updateChanges = (payload) => {
  return (memo, d) => {
    const traitName = (_.last(d.path) || "").toString();

    if (d.kind === "E") {
      // if this is an edit, we only apply the changes the value is different
      // independently of the type
      if (_.toString(d.lhs) === _.toString(d.rhs)) {
        return memo;
      }

      // in case of date, we do a diff on seconds, in order to avoid ms precision
      if (
        traitName.match &&
        traitName.match(/_at$|date$/) &&
        _.isString(d.lhs)
      ) {
        if ([d.lhs, d.rhs].every(v => moment(v).isValid())) {
          if (moment(d.lhs).diff(d.rhs, "seconds") === 0) {
            return memo;
          }
        }
      }
    }

    if (d.kind === "E") {
      _.set(memo, d.path, d.rhs);
    }

    if (d.kind === "N" && !_.isNil(d.rhs)) {
      if (_.isObject(d.rhs)) {
        if (!_.isEmpty(_.omitBy(d.rhs, _.isNil))) {
          _.set(memo, d.path, d.rhs);
        }
      } else {
        _.set(memo, d.path, d.rhs);
      }
    }

    // when we have an array updated we set the whole
    // array in `changed` constant
    if (d.kind === "A") {
      _.set(memo, d.path, _.get(payload, d.path, []));
    }
    return memo;
  };
};

function isInSegment(segments = [], segmentName) {
  return _.includes(_.map(segments, "name"), segmentName);
}

function enteredSegment(changes = {}, name) {
  return _.find(_.get(changes, "segments.entered"), s => s.name === name);
}

function leftSegment(changes = {}, name) {
  return _.find(_.get(changes, "segments.entered"), s => s.name === name);
}

const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}

module.exports = function compute(
  {
    changes = {}, user, account, segments, account_segments, events = []
  },
  ship = {},
  options = {}
) {
  const { preview, logger } = options;
  const { private_settings = {} } = ship;
  const { code = "", sentry_dsn: sentryDsn } = private_settings;

  // Manually add traits hash if not already there
  user.traits = user.traits || {};
  account = account || user.account || {};
  delete user.account;

  const sandbox = getSandbox(ship);
  sandbox.changes = changes;
  sandbox.user = user;
  sandbox.account = account;
  sandbox.events = events;
  sandbox.segments = segments;
  sandbox.account_segments = account_segments || [];
  sandbox.ship = ship;
  sandbox.payload = {};
  sandbox.isInSegment = isInSegment.bind(null, segments);
  sandbox.enteredSegment = enteredSegment.bind(null, changes);
  sandbox.leftSegment = leftSegment.bind(null, changes);

  applyUtils(sandbox);

  let tracks = [];
  const userTraits = [];
  const accountTraits = [];
  let accountClaims = {};
  const logs = [];
  const logsForLogger = [];
  const errors = [];
  let isAsync = false;

  sandbox.results = [];
  sandbox.errors = errors;
  sandbox.logs = logs;
  sandbox.track = (eventName, properties = {}, context = {}) => {
    if (eventName) tracks.push({ eventName, properties, context });
  };
  sandbox.traits = (properties = {}, context = {}) => {
    userTraits.push({
      properties: _.mapKeys(properties, (v, k) => k.toLowerCase()),
      context
    });
  };
  sandbox.hull = {
    account: (claims = null) => {
      if (claims) accountClaims = claims;
      return {
        traits: (properties = {}, context = {}) => {
          accountTraits.push({
            properties: _.mapKeys(properties, (v, k) => k.toLowerCase()),
            context
          });
        },
        isInSegment: isInSegment.bind(null, account_segments)
      };
    },
    traits: (properties = {}, context = {}) => {
      userTraits.push({
        properties: _.mapKeys(properties, (v, k) => k.toLowerCase()),
        context
      });
    },
    track: (eventName, properties = {}, context = {}) => {
      if (eventName) tracks.push({ eventName, properties, context });
    }
  };

  sandbox.request = (opts, callback) => {
    isAsync = true;
    const ts = new Date();
    const requestId = _.uniqueId("request-");
    const params = _.isString(opts) ? { url: opts } : opts;
    logger.debug("ship.service_api.request", { ...params, requestId });
    return request.defaults({ timeout: 5000 })(
      params,
      (error, response, body) => {
        logger.debug("ship.service_api.response", {
          requestId,
          time: new Date() - ts,
          statusCode: _.get(response, "statusCode"),
          uri: _.get(response, "request.uri.href"),
          method: _.get(response, "request.method")
        });
        try {
          callback(error, response, body);
        } catch (err) {
          if (err && err.toString) {
            const msg = err.toString();
            errors.push(msg);
            logger.info("outgoing.user.error", { error: msg });
          }
        }
      }
    );
  };

  function log(...args) {
    logs.push(args);
  }

  function isGenericDomain(domain = "", additionalDomains = []) {
    return _.includes([...emailDomains, ...additionalDomains], domain);
  }
  sandbox.isGenericDomain = isGenericDomain;

  function isGenericEmail(email = "", additionalDomains = []) {
    if (email.indexOf("@") === 1) {
      log(`${email} doesn't seem to be an email`);
      return false;
    }
    return isGenericDomain(email.split("@")[1], additionalDomains);
  }
  sandbox.isGenericEmail = isGenericEmail;

  function debug(...args) {
    // Only show debug logs in preview mode
    if (options.preview) {
      logs.push(args);
    }
  }

  function logError(...args) {
    errors.push(args);
  }

  function info(...args) {
    logs.push(args);
    logsForLogger.push(args);
  }
  sandbox.console = {
    log, warn: log, error: logError, debug, info
  };

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
        results.push(function() {
          "use strict";
          ${code}
        }());
      } catch (err) {
        errors.push(err.toString());
        captureException(err);
      }`);
    script.runInContext(sandbox);
  } catch (err) {
    if (err && err.toString) {
      const msg = err.toString();
      errors.push(msg);
      logger.info("outgoing.user.error", { error: msg });
    }
    sandbox.captureException(err);
  }

  if (
    isAsync &&
    !_.some(_.compact(sandbox.results), r => _.isFunction(r.then))
  ) {
    errors.push("It seems you’re using 'request' which is asynchronous.");
    errors.push("You need to return a 'new Promise' and 'resolve' or 'reject' it in your 'request' callback.");
  }

  // Forcing all promises to timeout at 5000ms
  const promises = sandbox.results.map(p => Promise.resolve(p).timeout(5000));

  return Promise.all(promises)
    .catch((err) => {
      if (err && err.toString) {
        const msg = err.message || err.toString();
        errors.push(msg);
        logger.info("outgoing.user.error", { error: msg });
      }
      sandbox.captureException(err);
    })
    .then(() => {
      if (preview && tracks.length > 10) {
        logs.unshift([tracks]);
        logs.unshift([
          `You're trying to send ${
            tracks.length
          } calls at a time. We will only process the first 10`
        ]);
        logs.unshift([
          "You can't send more than 10 tracking calls in one batch."
        ]);
        tracks = _.slice(tracks, 0, 10);
      }

      const payload = {
        user: _.reduce(userTraits, buildPayload, {}),
        account: _.reduce(accountTraits, buildAccountPayload, {})
      };

      // we don't concatenate arrays, we use only new values:
      const arrayMerge = (destinationArray, sourceArray) => sourceArray;
      const updated = {
        user: deepMerge(user, payload.user, { arrayMerge }),
        account: deepMerge(account, payload.account, { arrayMerge })
      };

      const diff = {
        user: deepDiff(user, updated.user) || [],
        account: deepDiff(account, updated.account) || []
      };

      const changed = {
        user: _.reduce(diff.user, updateChanges(payload.user), {}),
        account: _.reduce(diff.account, updateChanges(payload.account), {})
      };

      return {
        logs,
        logsForLogger,
        errors,
        payload,
        changes: changed,
        events: tracks,
        ...updated,
        accountClaims
      };
    });
};
