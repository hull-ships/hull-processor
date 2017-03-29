/* global describe, it */
const compute = require("../server/compute");
const { events, segments, user, account, account_segments, ship } = require("./fixtures");
const { expect, should } = require("chai");
should();

const payload = { events, segments, user, account, account_segments };

const CODE = {
  identity: "hull.account().traits({})",
  domain_claim: "hull.account({ domain: 'google.com' })",
  one: "hull.account().traits({ domain: 'test', boom: 'bam' });",
  new_boolean: "hull.account().traits({ new_boolean: true });",
  group: "hull.account().traits({ line: 'test'}, { source: 'group' });",
  utils: "hull.account().traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
  add_array_element: "hull.account().traits({ testing_array: ['A', 'B', 'C', 'E'] })",
  modify_array_element: "hull.account().traits({ testing_array: ['F', 'B', 'C', 'E'] })",
  delete_array_element: "hull.account().traits({ testing_array: ['A', 'B'] })",
  array_to_string: "hull.account().traits({ testing_array: 'abcdef' })",
  string_to_array: "hull.account().traits({ foo: ['A', 'B'] })",
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

describe("Compute Ship for accounts", () => {
  describe("Compute method with accounts", () => {
    it("Should not change content if code does not change content", () => {
      const result = applyCompute(CODE.identity);
      expect(result.user).to.be.eql(user);
      expect(result.account).to.be.eql(account);
      expect(result.accountClaims).to.be.eql(null);
    });

    it("Should set account claims", () => {
      const result = applyCompute(CODE.domain_claim);
      expect(result.user).to.be.eql(user);
      expect(result.changes).to.be.eql({ account: {}, user: {} });
      expect(result.accountClaims).to.be.eql({ domain: "google.com" });
    });

    it("Should only add the correct number of entries and nothing else", () => {
      const result = applyCompute(CODE.one);
      expect(result.user).to.be.eql(user);
      expect(result.changes.user).to.be.eql({});
      expect(result.changes.account).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
    });

    it("Should add trait when code adds a trait", () => {
      const result = applyCompute(CODE.new_boolean);
      expect(result.user).to.be.eql(user);
      expect(result).to.have.deep.property("account.traits.new_boolean", true);
    });

    it("Should return grouped objects when groups are passed", () => {
      const result = applyCompute(CODE.group);
      expect(result.user).to.be.eql(user);
      expect(result).to.have.deep.property("account.group.line", "test");
    });

    it("Should return grouped objects when groups are passed", () => {
      const result = applyCompute(CODE.utils);
      expect(result.user).to.be.eql(user);
      expect(result).to.have.deep.property("changes.account.traits.hello_at", "20160101");
      expect(result).to.have.deep.property("changes.account.traits.host", "hull.io");
      expect(result).to.have.deep.property("changes.account.traits.keys", "a,b");
    });

    it("Should add an array element", () => {
      const result = applyCompute(CODE.add_array_element);
      expect(result.user).to.be.eql(user);
      expect(result.changes.account.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
    });

    it("Should modify an array element", () => {
      const result = applyCompute(CODE.modify_array_element);
      expect(result.user).to.be.eql(user);
      expect(result.changes.account.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
    });

    it("Should delete an array element", () => {
      const result = applyCompute(CODE.delete_array_element);
      expect(result.user).to.be.eql(user);
      expect(result.changes.account.traits.testing_array).to.deep.equal(["A", "B"]);
    });

    it("Should change an array to string", () => {
      const result = applyCompute(CODE.array_to_string);
      expect(result.user).to.be.eql(user);
      expect(result.changes.account.traits.testing_array).to.equal("abcdef");
    });

    it("Should change a string to an array", () => {
      const result = applyCompute(CODE.string_to_array);
      expect(result.user).to.be.eql(user);
      expect(result.changes.account.traits.foo).to.deep.equal(["A", "B"]);
    });
  });
});
