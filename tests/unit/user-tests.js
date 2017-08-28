/* global describe, it */
import sinon from "sinon";
import hullSpy from "./support/mocks/hull";

const { events, segments, user, ship, changes } = require("./support/fixtures/index");
const message = { changes, events, segments, user };

import updateUser from "../../server/user-update";

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
  simple: {
    payload_old: "traits({ test: 'trait' });",
    payload: "hull.traits({ test: 'trait' });",
    result: { test: "trait" }
  },
  complex: {
    payload_old: "traits({ test:10 }); traits({ test:1 },{ source:'group' });",
    payload: "hull.traits({ test:10 }); traits({ test:1 },{ source:'group' });",
    result: { test: 10, "group/test": 1 }
  },
  conflict: {
    payload_old: "traits({ test: 4, 'group/test': 1}); traits({ test: 2 }, { source: 'group' });",
    payload: "hull.traits({ test: 4, 'group/test': 1}); traits({ test: 2 }, { source: 'group' });",
    result: { test: 4, "group/test": 2 }
  },
  nested: {
    payload_old: "traits({ value: 'val0', group: { value: 'val1', group: { value: 'val2' } } } }, { source: 'group' });",
    payload: "hull.traits({ value: 'val0', group: { value: 'val1', group: { value: 'val2' } } } }, { source: 'group' });",
    result: { "traits_group/value": "val0", "traits_group/group/value": "val1", "traits_group/group/group/value": "val2" }
  },
  withEmail: {
    payload_old: "traits({ name: 'Hello Friend', email: 'hello@friend.com' });",
    payload: "hull.traits({ name: 'Hello Friend', email: 'hello@friend.com' });",
    result: { email: "hello@friend.com", name: "Hello Friend" }
  },
  console_info: {
    payload: "console.info('boom', 'bam')",
    result: {}
  },
  console_log: {
    payload: "console.log('boom', 'bam')",
    result: {}
  },
  uppercase: {
    payload_old: "hull.traits({ Last_Name: user.last_name })",
    payload: "traits({ Last_Name: user.last_name })",
    result: {},
  },
};

function payload_old(p) {
  return TESTS[p].payload_old;
}

function payload(p) {
  return TESTS[p].payload;
}

describe("Compute Ship", () => {
  describe("User Update Handler", () => {
    it("Should use email in the asUser method call", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("withEmail"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "asUser", { email: "hello@friend.com", id: message.user.id });
        done();
      });
    });

    it("Should not call traits if no changes", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("traits({})");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.neverCalledWithMatch(spy, "traits");
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should not call traits if no changes and ignore case in traits keys", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload_old("uppercase"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.neverCalledWithMatch(spy, "traits");
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call with a correct payload for a simple trait", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload_old("simple"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "traits", TESTS.simple.result);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call with a correct payload for a complex trait", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload_old("complex"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "traits", TESTS.complex.result);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should handle conflicts the way it's expected", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload_old("conflict"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "traits", TESTS.conflict.result);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call with a track for a simple track", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return { traits: { test:'trait' } };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "track", "Event", { key: "value" }, { ip: "0", source: "processor" });
        done();
      });
    });

    it("Should call with 10 tracks for 10 tracks", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.callCount(spy, 23);
        sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
        sinon.assert.neverCalledWithMatch(spy, "traits");
        done();
      });
    });

    it("Should call with 10 tracks for 12 tracks", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.callCount(spy, 27);
        sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
        sinon.assert.neverCalledWithMatch(spy, "traits");
        done();
      });
    });

    it("Should not call traits if there is an empty return", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return {};");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
        sinon.assert.neverCalledWithMatch(spy, "traits");
        done();
      });
    });

    it("Should not call traits if there is no return", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return;");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
        sinon.assert.neverCalledWithMatch(spy, "traits");
        done();
      });
    });

    it("Should properly flatten nested groups", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("nested"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "asUser", message.user);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call hull logger", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("console_info"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "logger.info", "compute.user.log", { log: ["boom", "bam"] });
        done();
      });
    });

    it("Should not call hull logger", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("console_log"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.neverCalledWith(spy, "logger.info", "compute.user.log", { log: ["boom", "bam"] });
        done();
      });
    });
  });

  describe("User Update Handler using scoped hull object", () => {
    it("Should not call traits if no changes", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode("traits({})");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.neverCalledWithMatch(spy, "traits");
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should not call traits if no changes and ignore case in traits keys", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("uppercase"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.neverCalledWithMatch(spy, "traits");
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call with a correct payload for a simple trait", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("simple"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "traits", TESTS.simple.result);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });

    it("Should call with a correct payload for a complex trait", (done) => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("complex"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s }).then(() => {
        sinon.assert.calledWith(spy, "traits", TESTS.complex.result);
        sinon.assert.neverCalledWithMatch(spy, "track");
        done();
      });
    });
  });
});
