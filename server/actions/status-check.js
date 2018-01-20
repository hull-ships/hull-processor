import check from "syntax-error";
import _ from "lodash";
import lint from "../lint-code";

export default function statusCheck(req, res) {
  const { ship, client } = req.hull;
  // const messages = [];
  // let status = "ok";

  function send({ status = "ok", messages = [] }) {
    res.json({ messages, status });
    return client.put(`${req.hull.ship.id}/status`, { status, messages });
  }

  const code = _.get(ship.private_settings, "code");
  if (!code) {
    return send({
      status: "warning",
      messages: ["There is no code in this processor"]
    });
  }

  let status = "ok";
  const messages = [];
  const err = check(code);

  if (err) {
    status = "error";
    messages.push("There are errors in the code");
    messages.push(err.annotated);
  }

  const linter = lint(code);
  if (linter.length) {
    status = "error";
    messages.push(...linter);
  }

  return send({ status, messages });
}
