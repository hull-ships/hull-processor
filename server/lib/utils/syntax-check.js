const check = require("syntax-error");

function syntaxCheck(code) {
  const scriptCode = `
        (function() {
          "use strict";
          ${code}
        }())`;
  return check(scriptCode);
}

module.exports = syntaxCheck;
