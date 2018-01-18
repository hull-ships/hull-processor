import check from "syntax-error";
import _ from "lodash";

export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const messages = [];
  let status = "ok";
  if (!_.get(ship.private_settings, "code")) {
    status = "warning";
    messages.push("There is no code in this processor");
  }

  const err = check(_.get(ship.private_settings, "code"));
  if (err) {
    status = "error";
    messages.push("There are errors in the code");
    messages.push(err);
  }

  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
}
