import { linter } from "eslint";

function formatLinterError(l) {
  console.log(l);
  return `Error at line ${l.line}, column ${l.column}
${l.source}
--------------------------
${l.message}`;
}

const CONFIG = {
  env: {
    es6: true
  },
  globals: {
    changes: false,
    _: false,
    moment: false,
    urijs: false,
    user: false,
    account: false,
    events: false,
    segments: false,
    account_segments: false,
    ship: false,
    payload: false,
    results: false,
    errors: false,
    logs: false,
    track: false,
    traits: false,
    hull: false,
    request: false,
    console: false,
    captureMessage: false,
    captureException: false,
    isGenericEmail: false,
    isGenericDomain: false,
    isInSegment: false,
    enteredSegment: false,
    leftSegment: false
  },
  rules: {
    "no-undef": [2]
  }
};
export default function lint(code) {
  const messages = linter.verify(`try {
    results.push(function() {
      "use strict";
      ${code}
    }());
  } catch (err) {
    errors.push(err.toString());
  }`, CONFIG, {
    filename: "Processor Code"
  });
  return messages.map(formatLinterError);
}
