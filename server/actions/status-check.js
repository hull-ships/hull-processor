import check from "syntax-error";
import _ from "lodash";

export default function statusCheck(req, res) {
  const { ship } = req.hull;
  const messages = [];
  let status = "ok";
  if (!_.get(ship.private_settings, "code")) {
    status = "error";
    messages.push("Settings are empty");
  }

  const err = check(ship.private_settings.code);
  if (err) {
    status = "error";
    messages.push("Settings are referencing invalid values");
  }

  return res.json({ messages, status });
}
