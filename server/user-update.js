
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
  const asUser = hull.asUser(user);
  asUser.logger.info("incoming.user.start");
  return compute(message, ship)
  .then(({ changes, events, account, accountClaims, logsForLogger, errors }) => {
    // Update user traits
    if (_.size(changes.user)) {
      const flat = {
        ...changes.user.traits,
        ...flatten({}, "", _.omit(changes.user, "traits")),
      };

      if (_.size(flat)) {
        if (flat.email) {
          hull.asUser({ id: user.id, email: flat.email }).traits(flat)
            .then(() => {
              asUser.logger.info("incoming.user.success", { changes: flat });
            }, (error) => {
              asUser.logger.info("incoming.user.error", { error });
            });
        } else {
          asUser.traits(flat)
            .then(() => {
              asUser.logger.info("incoming.user.success", { changes: flat });
            }, (error) => {
              asUser.logger.info("incoming.user.error", { error });
            });
        }
      }
    } else {
      asUser.logger.info("incoming.user.skip", { message: "No Changes" });
    }

    // Update account traits
    if (_.size(changes.account)) {
      const flat = flatten({}, "", changes.account);

      if (_.size(flat)) {
        const asAccount = asUser.account(accountClaims);
        asAccount.traits(flat);
        asAccount.logger.info("incoming.account.success", { changes: flat });
      }
    } else if (_.size(accountClaims) && (_.size(account) || !_.isMatch(account, accountClaims))) {
      // Link account
      asUser.account(accountClaims).traits({});
      asUser.logger.info("incoming.account.link", { account: _.pick(account, "id"), accountClaims });
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => {
        asUser.logger.info("incoming.event.track", { properties, eventName });
        return asUser.track(eventName, properties, { ip: "0", source: "processor", ...context });
      });
    }

    if (errors && errors.length > 0) {
      // TODO: this call can be easily too high volume:
      // asUser.post(`/${ship.id}/notifications`, { status: "error", message: "Script error" });
      asUser.logger.info("incoming.user.error", { hull_summary: `Error Processing User: ${errors.join(", ")}`, errors, sandbox: true });
    }

    if (logsForLogger && logsForLogger.length) {
      logsForLogger.map(log => asUser.logger.info("compute.user.log", { log }));
    }
  })
  .catch(err => {
    asUser.logger.info("incoming.user.error", { hull_summary: `Error Processing User: ${_.get(err, "message", "Unexpected Error")}`, err, user, segments, sandbox: false });
  });
};
