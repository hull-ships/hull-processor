import _ from "lodash";
import Promise from "bluebird";

import updateUser from "../user-update";
import { notifHandler } from "hull/lib/utils";

const handler = notifHandler({
  handlers: {
    "ship:update": ({ ship, client }) => {
      if (!_.get(ship.private_settings, "code")) {
        return client.post(`/${ship.id}/notifications`, { status: "error", message: "Code empty" });
      }
      return Promise.resolve();
    },
    "user:update": ({ ship, client: hull }, messages = []) => {
      return Promise.all(messages.map(message => {
        // TODO: enable groupTraits option in the notifHandler
        message.user = hull.utils.groupTraits(message.user);
        return updateUser({ message }, { ship, hull });
      }));
    }
  }
});

export default handler;
