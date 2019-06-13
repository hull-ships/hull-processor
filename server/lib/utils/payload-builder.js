const _ = require("lodash");
const {
  TOP_LEVEL_ATTRIBUTES
} = require("../shared");

const buildUserPayload = (payload, traitsCall = {}) => {
  const {
    properties,
    context = {}
  } = traitsCall;
  if (properties) {
    const {
      source
    } = context;
    if (source) {
      _.map(properties, (v, k) => {
        const key = `${source}/${k}`;
        _.setWith(properties, key, v, Object);
        _.unset(properties, k);
      });
    }

    _.map(properties, (v, k) => {
      if (_.includes(TOP_LEVEL_ATTRIBUTES, k)) {
        payload[k] = v;
      } else {
        payload.traits = {
          ...payload.traits,
          [k]: v
        };
      }
    });
  }
  return payload;
};

const buildAccountPayload = (payload, traitsCall = {}) => {
  const {
    properties,
    context = {}
  } = traitsCall;
  if (properties) {
    const {
      source
    } = context;
    if (source) {
      _.map(properties, (v, k) => {
        const key = `${source}/${k}`;
        _.setWith(properties, key, v, Object);
        _.unset(properties, k);
      });
    }

    _.map(properties, (v, k) => {
      payload[k] = v;
    });
  }
  return payload;
};

module.exports = {
  buildUserPayload,
  buildAccountPayload
};
