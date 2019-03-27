const vm = require("vm");
const _ = require("lodash");
const moment = require("moment");
const raven = require("raven");
const deepDiff = require("deep-diff");
const deepMerge = require("deepmerge");
const request = require("request");
const Promise = require("bluebird");
const Hull = require("hull");

const { buildUserPayload, buildAccountPayload } = require("./utils/payload-builder");
const { frozenLodash, frozenMoment, frozenUrijs } = require("./utils/frozen-utils");
const { EMAIL_DOMAINS, EXCLUDED_EVENTS } = require("./shared");

function applyUtils(sandbox = {}) {
  sandbox.moment = frozenMoment;
  sandbox.urijs = frozenUrijs;
  sandbox._ = frozenLodash;
}

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

    if (d.kind === "N" && _.isNil(d.rhs)) {
      Hull.logger.debug("Unable to add new attribute with null value");
    }

    if (d.kind === "N" && !_.isNil(d.rhs)) {
      if (_.isObject(d.rhs)) {
        if (!_.isEmpty(_.omitBy(d.rhs, _.isNil))) {
          _.set(memo, d.path, d.rhs);
        } else {
          Hull.logger.debug("Unable to add new object with null value");
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

function getSandbox() {
  return vm.createContext({});
}

function compute(
  {
    changes = {},
    user,
    account,
    segments,
    account_segments,
    events = []
  },
  ship = {},
  options = {}
) {
  const {
    preview,
    logger,
    metric
  } = options;
  const {
    private_settings = {}
  } = ship;
  const {
    code = "", sentry_dsn: sentryDsn
  } = private_settings;

  // Manually add traits hash if not already there
  user.traits = user.traits || {};
  account = account || user.account || {};
  delete user.account;

  const sandbox = getSandbox(ship);
  sandbox.changes = changes;
  sandbox.user = user;
  sandbox.account = account;
  /**
   * See README.md Notes section for details behind events filtering
   */
  sandbox.events = _.filter(events, (evt) => {
    return !_.includes(_.get(evt, "event", ""), EXCLUDED_EVENTS);
  });
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
    if (eventName) {
      tracks.push({
        eventName,
        properties,
        context
      });
    }
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
      if (eventName) {
        tracks.push({
          eventName,
          properties,
          context
        });
      }
    }
  };

  sandbox.request = (opts, callback) => {
    isAsync = true;
    const ts = new Date();
    const requestId = _.uniqueId("request-");
    const params = _.isString(opts) ? {
      url: opts
    } : opts;
    logger.debug("connector.service_api.request", {
      ...params,
      requestId
    });
    return request.defaults({
      timeout: 5000
    })(
      params,
      (error, response, body) => {
        const method = _.get(params, "method", "GET");
        const status = _.get(response, "statusCode", "");
        const statusGroup = `${(status).toString().substring(0, 1)}xx`;
        logger.debug("ship.service_api.response", {
          requestId,
          time: new Date() - ts,
          statusCode: status,
          uri: _.get(response, "request.uri.href"),
          method
        });
        if (metric) {
          if (error === null) {
            metric.increment("connector.service_api.call", 1, [
              `method:${method}`,
              "url:processsor",
              `status:${status}`,
              `statusGroup:${statusGroup}`,
              `endpoint:${method} processor`,
            ]);
            metric.value("connector.service_api.response_time", (new Date() - ts), [
              `method:${method}`,
              "url:processsor",
              `status:${status}`,
              `statusGroup:${statusGroup}`,
              `endpoint:${method} processor`,
            ]);
          } else {
            metric.increment("connector.service_api.error", 1, [
              `method:${method}`,
              "url:processsor",
              `endpoint:${method} processor`,
            ]);
          }
        }
        try {
          callback(error, response, body);
        } catch (err) {
          if (err && err.toString) {
            const msg = err.toString();
            errors.push(msg);
            logger.info("outgoing.user.error", {
              error: msg
            });
          }
        }
      }
    );
  };

  function log(...args) {
    logs.push(args);
  }

  function isGenericDomain(domain = "", additionalDomains = []) {
    return _.includes([...EMAIL_DOMAINS, ...additionalDomains], domain);
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
      logs.push(_.cloneDeep(args));
    }
  }

  function logError(...args) {
    errors.push(_.cloneDeep(args));
  }

  function info(...args) {
    logs.push(_.cloneDeep(args));
    logsForLogger.push(_.cloneDeep(args));
  }
  sandbox.console = {
    log,
    warn: log,
    error: logError,
    debug,
    info
  };

  sandbox.captureException = function captureException(e) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.setExtraContext({
        user,
        segments,
        events
      });
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
      logger.info("outgoing.user.error", {
        error: msg
      });
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
        logger.info("outgoing.user.error", {
          error: msg
        });
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
        user: _.reduce(userTraits, buildUserPayload, {}),
        account: _.reduce(accountTraits, buildAccountPayload, {})
      };

      // we don't concatenate arrays, we use only new values:
      const arrayMerge = (destinationArray, sourceArray) => sourceArray;
      const updated = {
        user: deepMerge(user, payload.user, {
          arrayMerge
        }),
        account: deepMerge(account, payload.account, {
          arrayMerge
        })
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
}

module.exports = compute;
