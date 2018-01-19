import sinon from "sinon";
import hullSpy from "./support/mocks/hull";
import updateUser from "../../server/user-update";

const {
  events,
  segments,
  user,
  account,
  ship,
  changes
} = require("./support/fixtures/index");

const message = {
  changes, events, segments, user, account
};


function shipWithCode(code = {}, s = ship) {
  return {
    ...s,
    private_settings: {
      ...s.private_settings,
      code
    }
  };
}

const TESTS = {
  claim: {
    payload: "hull.account({ domain: 'facebook.com' })"
  },
  simple: {
    payload: "hull.account().traits({ test: 'trait' });",
    result: { test: "trait" }
  },
  complex: {
    payload: `
      hull.account().traits({ test:10 });
      hull.account().traits({ test:1 }, { source:'group' });`,
    result: { test: 10, "group/test": 1 }
  },
  conflict: {
    payload: `
      hull.account().traits({ test: 4, 'group/test': 1});
      hull.account().traits({ test: 2 }, { source: 'group' });`,
    result: { test: 4, "group/test": 2 }
  },
  check_account_group_existence: {
    payload: `
      if (user.clearbit_company && (account && !account.clearbit)) {
        hull.account().traits(user.clearbit_company);
      }`
  }
};

function payload(p) {
  return TESTS[p].payload;
}

describe("Account Update Handler", () => {
  it("Should not call traits if no changes", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode("traits({})");
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should call account with claims", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode(payload("claim"));
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.calledWith(spy, "account", { domain: "facebook.com" });
      sinon.assert.calledWith(spy, "traits", {});
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should not call link if already linked", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode("hull.account({ domain: 'hull.io'})");
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.neverCalledWithMatch(spy, "account");
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should call with a correct payload for a simple trait", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode(payload("simple"));
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.calledWith(spy, "account");
      sinon.assert.calledWith(spy, "traits", TESTS.simple.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should call with a correct payload for a complex trait", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode(payload("complex"));
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.calledWith(spy, "account");
      sinon.assert.calledWith(spy, "traits", TESTS.complex.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should handle conflicts the way it's expected", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode(payload("conflict"));
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.calledWith(spy, "account");
      sinon.assert.calledWith(spy, "traits", TESTS.conflict.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
      done();
    });
  });

  it("Should not validate the condition", (done) => {
    const spy = sinon.spy();
    const s = shipWithCode(payload("check_account_group_existence"));
    updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
      sinon.assert.neverCalledWithMatch(spy, "account");
      done();
    });
  });
});
