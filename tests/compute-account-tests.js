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
  user_and_account_traits: "hull.traits({ age: 24 }); hull.account({ domain: 'facebook.com' }).traits({ country_code: 'us' });"
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
    it("Should not change content if code does not change content", (done) => {
      applyCompute(CODE.identity).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.account).to.be.eql(account);
        expect(result.accountClaims).to.be.eql({});
        done();
      });
    });

    it("Should set account claims", (done) => {
      applyCompute(CODE.domain_claim).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes).to.be.eql({ account: {}, user: {} });
        expect(result.accountClaims).to.be.eql({ domain: "google.com" });
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(CODE.one).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.user).to.be.eql({});
        expect(result.changes.account).to.deep.equal({ traits: { boom: "bam" }, domain: "test" });
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(CODE.new_boolean).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result).to.have.deep.property("account.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.group).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result).to.have.deep.property("account.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.utils).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result).to.have.deep.property("changes.account.traits.hello_at", "20160101");
        expect(result).to.have.deep.property("changes.account.traits.host", "hull.io");
        expect(result).to.have.deep.property("changes.account.traits.keys", "a,b");
        done();
      });
    });

    it("Should add an array element", (done) => {
      applyCompute(CODE.add_array_element).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.account.traits.testing_array).to.deep.equal(["A", "B", "C", "E"]);
        done();
      });
    });

    it("Should modify an array element", (done) => {
      applyCompute(CODE.modify_array_element).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.account.traits.testing_array).to.deep.equal(["F", "B", "C", "E"]);
        done();
      });
    });

    it("Should delete an array element", (done) => {
      applyCompute(CODE.delete_array_element).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.account.traits.testing_array).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change an array to string", (done) => {
      applyCompute(CODE.array_to_string).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.account.traits.testing_array).to.equal("abcdef");
        done();
      });
    });

    it("Should change a string to an array", (done) => {
      applyCompute(CODE.string_to_array).then(result => {
        expect(result.user).to.be.eql(user);
        expect(result.changes.account.traits.foo).to.deep.equal(["A", "B"]);
        done();
      });
    });

    it("Should change both user and account", (done) => {
      applyCompute(CODE.user_and_account_traits).then(result => {
        expect(result.accountClaims).to.eql({ domain: "facebook.com" });
        expect(result.changes.user).to.deep.equal({ traits: { age: 24 } });
        expect(result.changes.account).to.deep.equal({ traits: { country_code: "us" } });
        done();
      });
    });
  });
});
