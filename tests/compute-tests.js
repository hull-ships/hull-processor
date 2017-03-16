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
  one: "traits({ domain: 'test', boom: 'bam' })",
  new_boolean: "traits({ new_boolean: true });",
  group: "traits({ line: 'test'}, { source: 'group' });",
  utils: "traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
  add_array_element: "traits({ testing_array: ['A', 'B', 'C', 'E'] })",
  modify_array_element: "traits({ testing_array: ['F', 'B', 'C', 'E'] })",
  delete_array_element: "traits({ testing_array: ['A', 'B'] })",
  array_to_string: "traits({ testing_array: 'abcdef' })",
  string_to_array: "traits({ foo: ['A', 'B'] })"
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
      const result = applyCompute(CODE.empty);
      expect(result.user).to.be.eql(user);
    });

    it("Should not change content if code returns invalid ", () => {
      const result = applyCompute(CODE.invalid);
      expect(result.user).to.be.eql(user);
    });

    it("Should not change content if code does not change content", () => {
      const result = applyCompute(CODE.identity);
      expect(result.user).to.be.eql(user);
    });

    it("Should only add the correct number of entries and nothing else", () => {
      const result = applyCompute(CODE.one);
      expect(result.changes).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
    });

    it("Should add trait when code adds a trait", () => {
      const result = applyCompute(CODE.new_boolean);
      expect(result).to.have.deep.property("user.traits.new_boolean", true);
    });

    it("Should return grouped objects when groups are passed", () => {
      const result = applyCompute(CODE.group);
      expect(result).to.have.deep.property("user.group.line", "test");
    });

    it("Should return grouped objects when groups are passed", () => {
      const result = applyCompute(CODE.utils);
      expect(result).to.have.deep.property("changes.traits.hello_at", "20160101");
      expect(result).to.have.deep.property("changes.traits.host", "hull.io");
      expect(result).to.have.deep.property("changes.traits.keys", "a,b");
    });

    it("Should add an array element", () => {
      const result = applyCompute(CODE.add_array_element);
      expect(result.changes.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
    });

    it("Should modify an array element", () => {
      const result = applyCompute(CODE.modify_array_element);
      expect(result.changes.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
    });

    it("Should delete an array element", () => {
      const result = applyCompute(CODE.delete_array_element);
      console.log("DELETE", result.changes);
      expect(result.changes.traits.testing_array).to.deep.equal(["A", "B"]);
    });

    it("Should change an array to string", () => {
      const result = applyCompute(CODE.array_to_string);
      expect(result.changes.traits.testing_array).to.equal("abcdef");
    });

    it("Should change a string to an array", () => {
      const result = applyCompute(CODE.string_to_array);
      expect(result.changes.traits.foo).to.deep.equal(["A", "B"]);
    });
  });
});
