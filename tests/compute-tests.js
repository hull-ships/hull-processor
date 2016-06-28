/* global describe, it */
const compute = require("../server/compute");
const { events, segments, user, ship } = require("./fixtures");
const { expect, should } = require("chai");
should();

const payload = { events, segments, user };

const CODE = {
  empty: ` `,
  invalid: ` return false; `,
  identity: `
      return { }
  `,
  new_boolean: `
    return {
      traits: {
        new_boolean: true
      }
    }
  `,
  root_level: `
    return {
      new_boolean: true
    }
  `,
  group: `
    return {
      group:{
        line: 'test'
      }
    }
  `,
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

    // it("Should ignore root-level traits when code adds a trait at root level", () => {
    //   const computed = applyCompute(CODE.root_level);
    //   expect(computed.result.user).to.be.eql(user);
    // });

  });
});
