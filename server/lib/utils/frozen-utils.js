const _ = require("lodash");
const moment = require("moment");
const urijs = require("urijs");
const deepFreeze = require("deep-freeze");

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

module.exports = {
  frozenMoment,
  frozenUrijs,
  frozenLodash
};
