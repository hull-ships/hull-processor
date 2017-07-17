
import compute from "./compute";
import _ from "lodash";
import isGroup from "./is-group-trait";

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
  .then(({ changes, events, account, accountClaims, logs, errors }) => {
    const asUser = hull.asUser(user.id);

    asUser.logger.info("compute.user.debug", { changes, accountClaims });

    // Update user traits
    if (_.size(changes.user)) {
      const flat = {
        ...changes.user.traits,
        ...flatten({}, "", _.omit(changes.user, "traits")),
      };

      if (_.size(flat)) {
        asUser.logger.info("compute.user.computed", { changes: flat });
        asUser.traits(flat);
      }
    }

    // Update account traits
    if (_.size(changes.account)) {
      const flat = flatten({}, "", changes.account);

      if (_.size(flat)) {
        asUser.logger.info("compute.account.computed", { account: _.pick(account, "id"), accountClaims, changes: flat });
        asUser.account(accountClaims).traits(flat);
      }
    } else if (_.size(accountClaims) && (_.size(account) || !_.isMatch(account, accountClaims))) {
      // Link account
      asUser.logger.info("compute.account.link", { account: _.pick(account, "id"), accountClaims });
      asUser.account(accountClaims).traits({});
    }

    if (errors && errors.length > 0) {
      asUser.logger.info("compute.user.error", { errors });
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, { ip: "0", source: "processor", ...context }));
    }

    if (errors && errors.length > 0) {
      asUser.logger.info("compute.user.error", { errors });
    }

    if (logs && logs.length) {
      logs.map(log => asUser.logger.info("compute.console.log", { log }));
    }
  })
  .catch(err => {
    console.log("error:", { err, message: err.message });
    hull.asUser({ id: user.id }).logger.info("compute.error", { err, user, segments });
  });
};
