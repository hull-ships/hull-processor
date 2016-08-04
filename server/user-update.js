import compute from "./compute";
import _ from "lodash";
import isGroup from "./is-group-trait";
// import _ from "lodash";

function flatten(obj, key, group) {
  return _.reduce(group, (m, v, k) => {
    const n = (key) ? `${key}/${k}` : k;
    if (isGroup(v)) {
      flatten(m, n, v);
    } else {
      m[n] = v;
    }
    return m;
  }, obj);
}

module.exports = function handle({ message = {} }, { ship, hull }) {
  const { user, segments } = message;
  try {
    const { changes, events } = compute(message, ship);
    const asUser = hull.as(user.id);
    if (_.size(changes)) {
      hull.logger.debug("user.computed", { id: user.id, email: user.email, changes: JSON.stringify(changes) });
      const flat = {
        ...changes.traits,
        ...flatten({}, "", _.omit(changes, "traits")),
      };
      asUser.traits(flat);
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, context));
    }
  } catch (err) {
    hull.logger.error("compute.error", { err, user, segments });
  }
};
