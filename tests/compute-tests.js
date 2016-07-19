/* global describe, it */
const compute = require("../server/compute");
const { events, segments, user, ship } = require("./fixtures");
const { expect, should } = require("chai");
should();

const payload = { events, segments, user };

const CODE = {
  empty: " ",
  invalid: " return false;",
  identity: "traits({})",
  new_boolean: "traits({ new_boolean: true });",
  group: "traits({ line: 'test'}, { source: 'group' });",
  utils: "traits({ host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })"
};

function shipWithCode(s = {}, code = {}) {
  return {
    ...s,
    private_settings: {
      ...s.private_settings,
      code
    }
  };
}

function applyCompute(c) {
  return compute(payload, shipWithCode(ship, c));
}

describe("Compute Ship", () => {
  describe("Compute method", () => {
    it("Should not change content if code does not return", () => {
      const computed = applyCompute(CODE.empty);
      expect(computed.result.user).to.be.eql(user);
    });

    it("Should not change content if code returns invalid ", () => {
      const computed = applyCompute(CODE.invalid);
      expect(computed.result.user).to.be.eql(user);
    });

    it("Should not change content if code does not change content", () => {
      const computed = applyCompute(CODE.identity);
      expect(computed.result.user).to.be.eql(user);
    });

    it("Should add trait when code adds a trait", () => {
      const computed = applyCompute(CODE.new_boolean);
      expect(computed).to.have.deep.property("result.user.traits.new_boolean", true);
    });

    it("Should return grouped objects when groups are passed", () => {
      const computed = applyCompute(CODE.group);
      expect(computed).to.have.deep.property("result.user.group.line", "test");
    });

    it("Should return grouped objects when groups are passed", () => {
      const computed = applyCompute(CODE.utils);
      expect(computed).to.have.deep.property("result.changes.traits.hello_at", "20160101");
      expect(computed).to.have.deep.property("result.changes.traits.host", "hull.io");
    });
  });
});
