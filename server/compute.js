import vm from 'vm';
import _ from 'lodash';
import moment from 'moment';
import urijs from 'urijs';
import { inspect } from 'util';
import raven from 'raven';

function getUtils() {
  const lodash = _.functions(_).reduce(function(l, key) {
    l[key] = function() {
      return _[key].apply(undefined, arguments);
    }
    return l;
  }, {});

  return {
    moment: function () { return moment.apply(undefined, arguments); },
    urijs: function () { return urijs.apply(undefined, arguments); },
    _: Object.freeze(lodash)
  }
};

function isInSegment(segments, segmentName) {
  return segments && segments.reduce((r, s) => { return r || s.name == segmentName }, false)
}

module.exports = function compute({ user, segments }, ship = {}, sourceCode) {

  const sandbox = Object.assign({
    user,
    segments,
    ship,
    output: {},
    traits: {},
    errors: [],
    logs: []
  }, getUtils());

  sandbox.isInSegment = isInSegment.bind(null, segments);

  function log(...args) {
    sandbox.logs.push(args.join(' '));
  }

  function logError(...args) {
    sandbox.errors.push(args.join(' '));
  }

  sandbox.console = { log, warn: log, error: logError };

  const private_settings = ship.private_settings || {};


  const code = sourceCode || private_settings.code || 'return {};';
  const sentryDsn = private_settings.sentry_dsn;

  sandbox.captureException = function(e) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.captureException(e);
    }
  }

  sandbox.captureMessage = function(msg) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.captureMessage(msg);
    }
  }

  try {
    const script = new vm.Script(`
      try {
        traits = Object.assign(traits, (function() {
          'use strict';
          ${code} }
        )() || {});
      } catch (err) {
        errors.push(err.toString());
        captureException(err);
      }`);
    script.runInNewContext(sandbox);
  } catch (err) {
    sandbox.errors.push(err.toString());
    sandbox.captureException(err);
  }


  sandbox.changes = _.reduce(sandbox.traits, (t,v,k) => {
    const key = k.toLowerCase();
    if (v !== user[`traits_${key}`]) {
      t[key] = v;
    }
    return t;
  }, {});

  const newUser = Object.assign({}, sandbox.user, _.reduce(sandbox.traits, (t,v,k) => {
    t[`traits_${k.toLowerCase()}`] = v
    return t;
  }, {}));

  sandbox.output = { user: newUser, segments: sandbox.segments }

  return Object.assign({}, sandbox, { code });
}
