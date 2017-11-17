import Promise from "bluebird";

import updateUser from "../user-update";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";

const handler = (flowControl) => (flowControl ? smartNotifierHandler : notifHandler)({
  handlers: {
    "user:update": ({ ship, client: hull, smartNotifierResponse }, messages = []) => {
      if (smartNotifierResponse && flowControl) {
        smartNotifierResponse.setFlowControl(flowControl);
      }
      return Promise.all(messages.map(message => {
        const account = hull.utils.groupTraits(message.account || message.user.account);
        message.user = hull.utils.groupTraits(message.user);

        if (account) {
          message.account = account;
          message.user.account = account;
        }

        return updateUser({ message }, { ship, hull });
      }));
    }
  }
});

export default handler;
