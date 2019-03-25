const _ = require("lodash");
const sinon = require("sinon");
const statusCheck = require("../../server/actions/status-check");
const shipFixture = require("./support/fixtures/ship");
const lint = require("../../server/lib/utils/lint-code");
const manifest = require("../../manifest");

// Get the default code provided by the manifest
const index = _.findIndex(manifest.private_settings, item => item.name === "code");
const defaultCode = manifest.private_settings[index].default;

const requestFixture = {
  hull: {
    ship: shipFixture,
    client: {
      put: () => {}
    }
  }
};

describe("Status Check Handler", () => {
  let responseSpy;

  before(() => {
    responseSpy = {
      json: sinon.spy()
    };
  });

  it("Should return a warning when code is absent", () => {
    requestFixture.hull.ship.private_settings.code = "";
    statusCheck(requestFixture, responseSpy);
    sinon.assert.calledWith(responseSpy.json, {
      messages: ["This processor doesn't contain code. It is recommended for performance reasons to remove empty processors from your organization."],
      status: "warning"
    });
  });

  it("Should return a warning when code is equal to default one", () => {
    requestFixture.hull.ship.private_settings.code = defaultCode;
    statusCheck(requestFixture, responseSpy);
    sinon.assert.calledWith(responseSpy.json, {
      messages: ["This processor contains default \"hello world\" code. If you need help with writing you script please refer connector documentation."],
      status: "warning"
    });
  });

  it("Should return an error when the code's syntax isn't valid", () => {
    const invalidCode = "d";
    const expectedError = lint(invalidCode);
    requestFixture.hull.ship.private_settings.code = invalidCode;
    statusCheck(requestFixture, responseSpy);
    sinon.assert.calledWith(responseSpy.json, {
      // expectedError is already an array, no need for []
      messages: expectedError,
      status: "error"
    });
  });
});
