/* global describe, it */
const compute = require("../server/compute");
const { events, segments, user, ship } = require("./fixtures");
const { expect, should } = require("chai");
should();

const payload = { events, segments, user };

// We need to keep backward compatibility (traits method scoped to the user by default)
const OLD_CODE = {
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

// New version: using hull object scoped to the user, mocking the hull-node library
const CODE = {
  empty: " ",
  invalid: " return false;",
  identity: "hull.traits({})",
  one: "hull.traits({ domain: 'test', boom: 'bam' })",
  new_boolean: "hull.traits({ new_boolean: true });",
  group: "hull.traits({ line: 'test'}, { source: 'group' });",
  utils: "hull.traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
  add_array_element: "hull.traits({ testing_array: ['A', 'B', 'C', 'E'] })",
  modify_array_element: "hull.traits({ testing_array: ['F', 'B', 'C', 'E'] })",
  delete_array_element: "hull.traits({ testing_array: ['A', 'B'] })",
  array_to_string: "hull.traits({ testing_array: 'abcdef' })",
  string_to_array: "hull.traits({ foo: ['A', 'B'] })",
  console_log: "console.log('hello log')",
  console_debug: "console.debug('hello debug')"
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

function applyCompute(c, options) {
  return compute(payload, shipWithCode(ship, c), options);
}

describe("Compute Ship", () => {
  describe("Compute method with old code", () => {
    it("Should not change content if code does not change content", (done) => {
      applyCompute(OLD_CODE.identity).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(OLD_CODE.one).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
        expect(result.changes.account).to.be.eql({});
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(OLD_CODE.new_boolean).then(result => {
        expect(result).to.have.deep.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(OLD_CODE.group).then(result => {
        expect(result).to.have.deep.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(OLD_CODE.utils).then(result => {
        expect(result).to.have.deep.property("changes.user.traits.hello_at", "20160101");
        expect(result).to.have.deep.property("changes.user.traits.host", "hull.io");
        expect(result).to.have.deep.property("changes.user.traits.keys", "a,b");
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(OLD_CODE.add_array_element).then(result => {
        expect(result.changes.user.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(OLD_CODE.modify_array_element).then(result => {
        expect(result.changes.user.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(OLD_CODE.delete_array_element).then(result => {
        expect(result.changes.user.traits.testing_array).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(OLD_CODE.array_to_string).then(result => {
        expect(result.changes.user.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(OLD_CODE.string_to_array).then(result => {
        expect(result.changes.user.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });
  });

  describe("Compute method using hull scoped object", () => {
    it("Should not change content if code does not return", (done) => {
      applyCompute(CODE.empty).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should not change content if code returns invalid ", (done) => {
      applyCompute(CODE.invalid).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should not change content if code does not change content", (done) => {
      applyCompute(CODE.identity).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(CODE.one).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(CODE.new_boolean).then(result => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.deep.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.group).then(result => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.deep.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.utils).then(result => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.deep.property("changes.user.traits.hello_at", "20160101");
        expect(result).to.have.deep.property("changes.user.traits.host", "hull.io");
        expect(result).to.have.deep.property("changes.user.traits.keys", "a,b");
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(CODE.add_array_element).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(CODE.modify_array_element).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(CODE.delete_array_element).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(CODE.array_to_string).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(CODE.string_to_array).then(result => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("return logs", (done) => {
      applyCompute(CODE.console_log).then(result => {
        expect(result.logs).to.deep.equal([["hello log"]]);
        done();
      });
    });

    it("return debug logs in preview mode", (done) => {
      applyCompute(CODE.console_debug, { preview: true }).then(result => {
        expect(result.logs).to.deep.equal([["hello debug"]]);
        done();
      });
    });

    it("ignore debug logs in normal mode", (done) => {
      applyCompute(CODE.console_debug).then(result => {
        expect(result.logs.length).to.eql(0);
        done();
      });
    });
  });
});
