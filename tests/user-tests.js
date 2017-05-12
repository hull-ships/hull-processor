/* global describe, it */
import sinon from "sinon";
import hullSpy from "./mocks/hull";

const { events, segments, user, ship, changes } = require("./fixtures");
const message = { changes, events, segments, user };

import updateUser from "../server/user-update";

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
    payload: "traits({ test: 'trait' });",
    result: { test: "trait" }
  },
  complex: {
    payload: "traits({ test:10 }); traits({ test:1 },{ source:'group' });",
    result: { test: 10, "group/test": 1 }
  },
  conflict: {
    payload: "traits({ test: 4, 'group/test': 1}); traits({ test: 2 }, { source: 'group' });",
    result: { test: 4, "group/test": 2 }
  },
  nested: {
    payload: "traits({ value: 'val0', group: { value: 'val1', group: { value: 'val2' } } } }, { source: 'group' });",
    result: { "traits_group/value": "val0", "traits_group/group/value": "val1", "traits_group/group/group/value": "val2" }
  },
  console: {
    payload: "console.log('boom', 'bam')",
    result: {}
  }
};

function payload(p) {
  return TESTS[p].payload;
}

describe("Compute Ship", () => {
  describe("User Update Handler", () => {
    it("Should not call traits if no changes", () => {
      const spy = sinon.spy();
      const s = shipWithCode("traits({})");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should call with a correct payload for a simple trait", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("simple"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "traits", TESTS.simple.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should call with a correct payload for a complex trait", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("complex"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "traits", TESTS.complex.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should handle conflicts the way it's expected", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("conflict"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "traits", TESTS.conflict.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should call with a track for a simple track", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return { traits: { test:'trait' } };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" }, { ip: "0", source: "processor" });
    });

    it("Should call with 10 tracks for 10 tracks", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.callCount(spy, 12);
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
      sinon.assert.neverCalledWithMatch(spy, "traits");
    });

    it("Should call with 10 tracks for 12 tracks", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.callCount(spy, 14);
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
      sinon.assert.neverCalledWithMatch(spy, "traits");
    });

    it("Should not call traits if there is an empty return", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return {};");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
      sinon.assert.neverCalledWithMatch(spy, "traits");
    });

    it("Should not call traits if there is no return", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); return;");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
      sinon.assert.neverCalledWithMatch(spy, "traits");
    });

    it("Should properly flatten nested groups", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("nested"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "as", "562123b470df84b740000042");
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should call hull logger", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("console"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "logger.info", "compute.console.log", ["boom", "bam"]);
    });
  });
});
