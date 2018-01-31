import Promise from "bluebird";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";
import _ from "lodash";
import updateUser from "../user-update";

const handler = flowControl =>
  (flowControl ? smartNotifierHandler : notifHandler)({
    handlers: {
      "user:update": (
        { ship, client: hull, smartNotifierResponse },
        messages = []
      ) => {
        if (smartNotifierResponse && flowControl) {
          smartNotifierResponse.setFlowControl(flowControl);
        }

        const user_ids = _.map(messages, "user.id");

        hull.logger.info("incoming.user.start", { ids: _.uniq(_.compact(user_ids)) });

        return Promise.all(messages.map((message) => {
          const account = hull.utils.groupTraits(message.account || message.user.account);
          message.user = hull.utils.groupTraits(message.user);

          if (account) {
            message.account = account;
            message.user.account = account;
          }

          return updateUser({ message }, { ship, hull });
        })).then((responses) => {
          const skipped = _.filter(responses, r => _.get(r, "response.status") === "skip");
          const skippedIds = _.map(skipped, "message.user.id");
          if (skippedIds.length > 0) {
            hull.logger.info("incoming.user.skip", { message: "No Changes", ids: _.uniq(_.compact(skippedIds)) });
          }
        });
      }
    }
  });

export default handler;
