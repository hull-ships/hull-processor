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
  ignore: {
    payload: { root: "value" },
  },
  ignores: {
    payload: { root: "value", traits: { test: "trait" } },
    result: { test: "trait" }
  },
  simple: {
    payload: { traits: { test: "trait" } },
    result: { test: "trait" }
  },
  complex: {
    payload: { traits: { test: 10 }, group: { test: 1 } },
    result: { test: 10, "group/test": 1 }
  },
  conflict: {
    payload: { traits: { test: 4, "group/test": 1 }, group: { test: 2 } },
    result: { test: 4, "group/test": 1 }
  },
  nested: {
    payload: { group: { value: "val0", group: { value: "val1", group: { value: "val2" } } } },
    result: { "traits_group/value": "val0", "traits_group/group/value": "val1", "traits_group/group/group/value": "val2" }
  },
};

function payload(p) {
  return `return ${JSON.stringify(TESTS[p].payload)};`;
}

describe("Compute Ship", () => {
  describe("User Update Handler", () => {
    it("Should not call traits if no changes", () => {
      const spy = sinon.spy();
      const s = shipWithCode("return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should not call traits if only root-level changes", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("ignore"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.neverCalledWithMatch(spy, "traits");
      sinon.assert.neverCalledWithMatch(spy, "track");
    });

    it("Should ignore the root-level traits that are not groups", () => {
      const spy = sinon.spy();
      const s = shipWithCode(payload("ignores"));
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.calledWith(spy, "traits", TESTS.ignores.result);
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
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
    });

    it("Should call with 10 tracks for 10 tracks", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.callCount(spy, 11);
      sinon.assert.calledWith(spy, "track", "Event", { key: "value" });
      sinon.assert.neverCalledWithMatch(spy, "traits");
    });

    it("Should call with 10 tracks for 12 tracks", () => {
      const spy = sinon.spy();
      const s = shipWithCode("track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); track('Event', { key: 'value' }); return { };");
      updateUser({ message }, { hull: hullSpy(s, spy), ship: s });
      sinon.assert.callCount(spy, 11);
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
      sinon.assert.called(spy, TESTS.nested.result);
      sinon.assert.neverCalledWithMatch(spy, "track");
    });
  });
});
