const _ = require("lodash");
const compute = require("./compute");
const isGroup = require("./utils/is-group-trait");

/* function flatten(obj, key, group) {
  return _.reduce(
    group,
    (m, v, k) => {
      const n = key ? `${key}/${k}` : k;
      if (isGroup(v)) {
        flatten(m, n, v);
      } else {
        m[n] = v;
      }
      return m;
    },
    obj
  );
} */

const count = (str, ch) => _.countBy(str)[ch] || 0;
function flattenToDepth(obj, key, group, depth) {
  return _.reduce(group, (m, v, k) => {
    const n = (key) ? `${key}/${k}` : k;
    if (isGroup(v) && count(n, "/") !== depth) {
      flattenToDepth(m, n, v, depth);
    } else {
      m[n] = v;
    }
    return m;
  }, obj);
}

function getIdent(user) {
  const ident = {
    id: user.id
  };
  if (_.has(user, "email")) {
    ident.email = _.get(user, "email", null);
  }
  if (_.has(user, "anonymous_id")) {
    ident.anonymous_id = _.head(_.get(user, "anonymous_id", []));
  }
  return ident;
}

function userUpdate({ message = {} }, { ship, hull, metric }) {
  const { user, segments } = message;
  const ident = getIdent(user);
  const asUser = hull.asUser(ident);
  return compute(message, ship, { logger: asUser.logger, metric })
    .then(({
      changes, events, account, accountClaims, logsForLogger, errors
    }) => {
      let response;
      // Update user traits
      if (_.size(changes.user)) {
        const flat = {
          ...changes.user.traits,
          ...flattenToDepth({}, "", _.omit(changes.user, "traits"), 1)
        };

        if (_.size(flat)) {
          if (flat.email) {
            _.set(ident, "email", flat.email);
            hull
              .asUser(ident)
              .traits(flat)
              .then(
                () => {
                  response = { status: "success", changes: flat };
                  asUser.logger.debug("incoming.user.success", {
                    changes: flat
                  });
                },
                (error) => {
                  response = { status: "error", error };
                  asUser.logger.info("incoming.user.error", { error });
                }
              );
          } else {
            asUser.traits(flat).then(
              () => {
                response = { status: "success", changes: flat };
                asUser.logger.debug("incoming.user.success", {
                  changes: flat
                });
              },
              (error) => {
                response = { status: "error", error };
                asUser.logger.info("incoming.user.error", { error });
              }
            );
          }
        }
      } else {
        response = { status: "skip", message: "No Changes" };
        asUser.logger.debug("incoming.user.skip", { message: "No Changes" });
      }

      // Update account traits
      if (_.size(changes.account)) {
        const flat = flattenToDepth({}, "", changes.account, 1);

        if (_.size(flat)) {
          const asAccount = asUser.account(accountClaims);
          asAccount.traits(flat);
          asAccount.logger.debug("incoming.account.success", {
            changes: flat,
            changedKeys: Object.keys(flat)
          });
        }
      } else if (
        _.size(accountClaims) &&
          (!_.size(account) || !_.isMatch(account, accountClaims))
      ) {
        // Link account
        asUser.account(accountClaims).traits({});
        asUser.logger.debug("incoming.account.link", {
          account: _.pick(account, "id"),
          accountClaims,
          accountClaimsSize: _.size(accountClaims),
          accountClaimsKeys: Object.keys(accountClaims)
        });
      }

      if (events.length > 0) {
        events.map(({ eventName, properties, context }) => {
          asUser.logger.debug("incoming.event.track", {
            properties,
            eventName
          });
          return asUser.track(eventName, properties, {
            ip: "0",
            source: "processor",
            ...context
          });
        });
      }

      if (errors && errors.length > 0) {
        // TODO: this call can be easily too high volume:
        // asUser.post(`/${ship.id}/notifications`, { status: "error", message: "Script error" });
        asUser.logger.info("incoming.user.error", {
          hull_summary: `Error Processing User: ${errors.join(", ")}`,
          errors,
          sandbox: true
        });
      }

      if (logsForLogger && logsForLogger.length) {
        logsForLogger.map(log =>
          asUser.logger.info("compute.user.log", { log }));
      }
      return { response, message };
    })
    .catch((err) => {
      asUser.logger.info("incoming.user.error", {
        hull_summary: `Error Processing User: ${_.get(
          err,
          "message",
          "Unexpected Error"
        )}`,
        err,
        user,
        segments,
        sandbox: false
      });
    });
}

module.exports = userUpdate;
