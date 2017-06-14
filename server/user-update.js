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
  .then(({ changes, events, account, accountClaims, errors, logs }) => {
    const asUser = hull.asUser(user.id);

    hull.logger.debug("compute.user.debug", { id: user.id, email: user.email, changes, accountClaims });

    // Update user traits
    if (_.size(changes.user)) {
      const flat = {
        ...changes.user.traits,
        ...flatten({}, "", _.omit(changes.user, "traits")),
      };

      if (_.size(flat)) {
        hull.logger.info("compute.user.computed", { id: user.id, email: user.email, changes: JSON.stringify(flat) });
        asUser.traits(flat);
      }
    }

    // Update account traits
    if (_.size(changes.account)) {
      const flat = {
        ...changes.account.traits,
        ...flatten({}, "", _.omit(changes.account, "traits")),
      };

      if (_.size(flat)) {
        hull.logger.info("compute.account.computed", { user: _.pick(user, "id", "email"), account: _.pick(account, "id"), accountClaims, changes: flat });
        asUser.account(accountClaims).traits(flat);
      }
    } else if (_.size(accountClaims) && (_.size(account) || !_.isMatch(account, accountClaims))) {
      // Link account
      hull.logger.info("compute.account.link", { user: _.pick(user, "id", "email"), account: _.pick(account, "id"), accountClaims });
      asUser.account(accountClaims).traits({});
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, { ip: "0", source: "processor", ...context }));
    }

    if (errors && errors.length > 0) {
      hull.logger.error("compute.user.error", { id: user.id, email: user.email, errors });
    }

    if (logs && logs.length) {
      logs.map(log => hull.logger.info("compute.console.log", { id: user.id, email: user.email, log }));
    }
  })
  .catch(err => {
    console.log("error:", { err, message: err.message });
    hull.logger.error("compute.error", { err, user, segments });
  });
};
