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
  one: "traits({ domain: 'test' })",
  new_boolean: "traits({ new_boolean: true });",
  group: "traits({ line: 'test'}, { source: 'group' });",
  utils: "traits({ keys: _.keys({ a: 1, b: 2 }).join(','), host: urijs('http://hull.io/hello').host(), hello_at: moment('2016-12-01').startOf('year').format('YYYYMMDD') })"
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
    it("Should not change content if code does not return", (done) => {
      applyCompute(CODE.empty).then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should not change content if code returns invalid ", (done) => {
      applyCompute(CODE.invalid).then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should not change content if code does not change content", (done) => {
      applyCompute(CODE.identity).then(result => {
        expect(result.user).to.be.eql(user);
        done();
      });
    });

    it("Should only add the correct number of entries and nothing else", (done) => {
      applyCompute(CODE.one).then(result => {
        expect(result.changes.traits).to.deep.equal({ domain: "test" });
        done();
      });
    });

    it("Should add trait when code adds a trait", (done) => {
      applyCompute(CODE.new_boolean).then(result => {
        expect(result).to.have.deep.property("user.traits.new_boolean", true);
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.group).then(result => {
        expect(result).to.have.deep.property("user.group.line", "test");
        done();
      });
    });

    it("Should return grouped objects when groups are passed", (done) => {
      applyCompute(CODE.utils).then(result => {
        expect(result).to.have.deep.property("changes.traits.hello_at", "20160101");
        expect(result).to.have.deep.property("changes.traits.host", "hull.io");
        expect(result).to.have.deep.property("changes.traits.keys", "a,b");
        done();
      });
    });
  });
});
