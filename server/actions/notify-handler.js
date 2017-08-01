import updateUser from "../user-update";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";

const handler = (flowControl) => (flowControl ? smartNotifierHandler : notifHandler)({
  handlers: {
    "user:update": ({ ship, client: hull, smartNotifierResponse }, messages = []) => {
      if (smartNotifierResponse && flowControl) {
        smartNotifierResponse.setFlowControl(flowControl);
      }
      return Promise.all(messages.map(message => {
        message.user = hull.utils.groupTraits(message.user);
        return updateUser({ message }, { ship, hull });
      }));
    }
  }
});

export default handler;
