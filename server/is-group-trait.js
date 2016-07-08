import _ from "lodash";

module.exports = function isGroup(o) {
  return _.isPlainObject(o) && !_.isEqual(_.sortBy(_.keys(o)), ["operation", "value"]);
};
