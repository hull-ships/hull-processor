import updateUser from "../user-update";
import { notifHandler } from "hull/lib/utils";

export default function notify(hostSecret) {
  return notifHandler({
    hostSecret,
    handlers: {
      "user:update": ({ ship, client: hull }, messages = []) => {
        return Promise.all(messages.map(message => {
          // TODO: enable groupTraits option in the notifHandler
          message.user = hull.utils.groupTraits(message.user);
          return updateUser({ message }, { ship, hull });
        }));
      }
    }
  });
}
