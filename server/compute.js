import vm from 'vm';
import _ from 'lodash';
import moment from 'moment';
import urijs from 'urijs';
import { inspect } from 'util';

function isInSegment(segments, segmentName) {
  return segments.reduce((r, s) => { return r || s.name == segmentName }, false)
}

module.exports = function compute({ user, segments }, ship, sourceCode) {

  const sandbox = {
    _,
    moment,
    urijs,
    user,
    segments,
    ship,
    traits: {},
    errors: [],
    logs: []
  };

  sandbox.isInSegment = isInSegment.bind(null, segments);

  function log(...args) {
    sandbox.logs.push(args.join(' '));
  }

  function logError(...args) {
    sandbox.errors.push(args.join(' '));
  }

  sandbox.console = { log, warn: log, error: logError };


  const code = sourceCode || ship.private_settings.code || '';

  try {
    const script = new vm.Script(`
      try {
        traits = Object.assign(traits, (function() { ${code} })() || {});
      } catch (err) {
        errors.push(err.toString());
      }`);
    script.runInNewContext(sandbox);
  } catch (err) {
    sandbox.errors.push(err.toString());
  }

  sandbox.changes = _.reduce(sandbox.traits, (t,v,k) => {
    const key = k.toLowerCase();
    if (v !== user[`traits_${key}`]) {
      t[key] = v;
    }
    return t;
  }, {});


  return Object.assign({}, sandbox, { code });
}
