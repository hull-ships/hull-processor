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
  return compute(message, ship)
  .then(({ changes, events }) => {
    const asUser = hull.as(user.id);

    hull.logger.debug("compute.user.debug", { id: user.id, email: user.email, changes: JSON.stringify(changes) });

    if (_.size(changes)) {
      const flat = {
        ...changes.traits,
        ...flatten({}, "", _.omit(changes, "traits")),
      };
      hull.logger.info("compute.user.computed", { id: user.id });
      asUser.traits(flat);
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, { source: "processor", ...context }));
    }
  })
  .catch(err =>
    hull.logger.error("compute.error", { err, user, segments })
  );
};
