const _ = require("lodash");
const lint = require("../lib/utils/lint-code");
const syntaxCheck = require("../lib/utils/syntax-check");

module.exports = function statusCheck(req, res) {
  const { ship, client } = req.hull;
  const messages = [];
  let status = "ok";

  const code = _.get(ship.private_settings, "code", "n/a");
  if (code === "n/a") {
    status = "warning";
    messages.push("This processor doesn't contain code. It is recommended for performance reasons to remove empty processors from your organization.");
  }

  if (status === "ok") {
    const syntaxCheckResult = syntaxCheck(code);

    if (syntaxCheckResult) {
      status = "error";
      messages.push("The code didn't pass the syntax check. Please review the detected problems and apply fixes where indicated.");
      messages.push(syntaxCheckResult.annotated);
    }

    const linterResult = lint(code);
    if (linterResult.length) {
      status = "error";
      messages.push(...linterResult);
    }
  }

  res.json({ messages, status });
  return client.put(`${req.hull.ship.id}/status`, { status, messages });
};
