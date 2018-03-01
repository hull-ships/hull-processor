const _ = require("lodash");

function isGroupTrait(hullObj) {
  return _.isPlainObject(hullObj) && !_.isEqual(_.sortBy(_.keys(hullObj)), ["operation", "value"]);
}

module.exports = isGroupTrait;
