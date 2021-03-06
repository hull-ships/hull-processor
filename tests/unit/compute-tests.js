/* global describe, it */
const compute = require("../../server/lib/compute");
const {
  events, segments, user, ship
} = require("./support/fixtures/index");
const { expect, should } = require("chai");
const moment = require("moment");

should();

const payload = { events, segments, user };

// We need to keep backward compatibility (traits method scoped to the user by default)
const OLD_CODE = {
  identity: "traits({})",
  one: "traits({ domain: 'test', boom: 'bam' })",
  new_boolean: "traits({ new_boolean: true });",
  group: "traits({ line: 'test'}, { source: 'group' });",
  utils:
    "traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
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
  utils:
    "hull.traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })",
  add_array_element: "hull.traits({ testing_array: ['A', 'B', 'C', 'E'] })",
  modify_array_element: "hull.traits({ testing_array: ['F', 'B', 'C', 'E'] })",
  delete_array_element: "hull.traits({ testing_array: ['A', 'B'] })",
  array_to_string: "hull.traits({ testing_array: 'abcdef' })",
  string_to_array: "hull.traits({ foo: ['A', 'B'] })",
  nullify_trait: "hull.traits({ foo: null })",
  nullify_empty_string: "hull.traits({ empty_string: null })",
  console_log: "console.log('hello log')",
  console_debug: "console.debug('hello debug')",
  modify_lodash_library: "_.map = 'foo'",
  use_lodash_library: "_.map(['foo'], (f) => f);",
  modify_moment_library: "moment = 'foo';",
  use_moment_library: "console.log(moment(1519894734, 'X').format())",
  invalid_assignment: "moment() = 'foo'"
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
      applyCompute(OLD_CODE.identity).then((result) => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(OLD_CODE.one).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user).to.deep.equal({
          traits: { boom: "bam" },
          domain: "test"
        });
        expect(result.changes.account).to.be.eql({});
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(OLD_CODE.new_boolean).then((result) => {
        expect(result).to.have.nested.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(OLD_CODE.group).then((result) => {
        expect(result).to.have.nested.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(OLD_CODE.utils).then((result) => {
        expect(result).to.have.nested.property(
          "changes.user.traits.hello_at",
          "20160101"
        );
        expect(result).to.have.nested.property(
          "changes.user.traits.host",
          "hull.io"
        );
        expect(result).to.have.nested.property(
          "changes.user.traits.keys",
          "a,b"
        );
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(OLD_CODE.add_array_element).then((result) => {
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "A",
          "B",
          "C",
          "E"
        ]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(OLD_CODE.modify_array_element).then((result) => {
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "F",
          "B",
          "C",
          "E"
        ]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(OLD_CODE.delete_array_element).then((result) => {
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "A",
          "B"
        ]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(OLD_CODE.array_to_string).then((result) => {
        expect(result.changes.user.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(OLD_CODE.string_to_array).then((result) => {
        expect(result.changes.user.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });
  });

  describe("Compute method using hull scoped object", () => {

    it("Should not change content if code does not return", (done) => {
      applyCompute(CODE.empty).then((result) => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should not change content if code returns invalid ", (done) => {
      applyCompute(CODE.invalid).then((result) => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should not change content if code does not change content", (done) => {
      applyCompute(CODE.identity).then((result) => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql({});
        expect(result.changes).to.be.eql({ user: {}, account: {} });
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(CODE.one).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user).to.deep.equal({
          traits: { boom: "bam" },
          domain: "test"
        });
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(CODE.new_boolean).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.nested.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.group).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.nested.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.utils).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result).to.have.nested.property(
          "changes.user.traits.hello_at",
          "20160101"
        );
        expect(result).to.have.nested.property(
          "changes.user.traits.host",
          "hull.io"
        );
        expect(result).to.have.nested.property(
          "changes.user.traits.keys",
          "a,b"
        );
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(CODE.add_array_element).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "A",
          "B",
          "C",
          "E"
        ]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(CODE.modify_array_element).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "F",
          "B",
          "C",
          "E"
        ]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(CODE.delete_array_element).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.deep.equal([
          "A",
          "B"
        ]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(CODE.array_to_string).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(CODE.string_to_array).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change an empty string to null value", (done) => {
      applyCompute(CODE.nullify_empty_string).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.empty_string).to.equal(null);
        done();
      });
    });

    it("Should change a string to null value", (done) => {
      applyCompute(CODE.nullify_trait).then((result) => {
        expect(result.account).to.be.eql({});
        expect(result.changes.user.traits.foo).to.equal(null);
        done();
      });
    });

    it("ignore traits whose time difference is in ms", (done) => {
      compute(
        {
          user: {
            traits: { date_precision_test_at: "2017-09-08T12:12:07.356Z" }
          }
        },
        shipWithCode(
          ship,
          "hull.traits({ date_precision_test_at: '2017-09-08T12:12:07Z' })"
        )
      ).then((result) => {
        expect(result.changes.user).to.be.deep.equal({});
        done();
      });
    });

    it("ignore traits which differ in type but not in value", (done) => {
      compute(
        { user: { traits: { type_value_test: "1000" } } },
        shipWithCode(ship, "hull.traits({ type_value_test: 1000 })")
      ).then((result) => {
        expect(result.changes.user).to.be.deep.equal({});
        done();
      });
    });

    it("return logs", (done) => {
      applyCompute(CODE.console_log).then((result) => {
        expect(result.logs).to.deep.equal([["hello log"]]);
        done();
      });
    });

    it("return debug logs in preview mode", (done) => {
      applyCompute(CODE.console_debug, { preview: true }).then((result) => {
        expect(result.logs).to.deep.equal([["hello debug"]]);
        done();
      });
    });

    it("ignore debug logs in normal mode", (done) => {
      applyCompute(CODE.console_debug).then((result) => {
        expect(result.logs.length).to.eql(0);
        done();
      });
    });

    it("should not allow to modify internal libraries - lodash", (done) => {
      applyCompute(CODE.modify_lodash_library)
        .then((result) => {
          expect(result.errors[0]).to.equal("TypeError: Cannot assign to read only property 'map' of object '[object Object]'");
          return applyCompute(CODE.use_lodash_library);
        })
        .then((result) => {
          expect(result.errors.length).to.equal(0);
          done();
        });
    });

    /**
     * We run the applyCompute twice here, first to modify the `moment` variable,
     * then second one to use it and see if the overwrite from first one
     * is populated in the second one.
     * Expected behavior is that no script can modify the globals in a way
     * which will be leaked to other script runs.
     */
    it("should not allow to modify internal libraries - momentjs", (done) => {
      applyCompute(CODE.modify_moment_library)
        .then((result) => {
          expect(result.errors.length).to.equal(0);
          return applyCompute(CODE.use_moment_library);
        })
        .then((result) => {
          expect(result.errors.length).to.equal(0);
          expect(result.logs[0][0]).to.equal(moment(1519894734, "X").format());
          done();
        });
    });

    it("should not allow to do an invalid assignment", (done) => {
      applyCompute(CODE.invalid_assignment)
        .then((result) => {
          expect(result.errors[0]).to.equal("ReferenceError: Invalid left-hand side in assignment");
          done();
        });
    });
  });
});
