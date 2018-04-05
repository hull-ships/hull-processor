const { expect } = require("chai");
const jwtDecode = require("jwt-decode");
const Minihull = require("minihull");

const bootstrap = require("./support/bootstrap");

describe("computing users", () => {
  let minihull;
  let server;

  const user = {
    id: "58b68d0f11111ef19e00df43",
    email: "thomas@hull.io",
    domain: "hull.io"
  };

  beforeEach(() => {
    minihull = new Minihull();
    server = bootstrap();
    return minihull.listen(8001);
  });

  afterEach((done) => {
    server.close(() => {
      minihull.close().then(done);
    });
  });

  describe("using the /notify endpoint", () => {
    it("should send traits to the firehose", (done) => {
      const code = "hull.traits({ foo: \"bar\" })";

      minihull.stubConnector({ id: "123456789012345678901235", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901235", "http://localhost:8000/notify", "user_report:update", { user }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql({ foo: "bar" });

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("user");
          expect(access_token.sub).to.equal(user.id);

          done();
        });
      });
    });

    it("should send an account link to the firehose", (done) => {
      const code = "hull.account({ domain: user.domain });";

      minihull.stubConnector({ id: "123456789012345678901236", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901236", "http://localhost:8000/notify", "user_report:update", { user }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql({});

          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          // claims
          expect(access_token["io.hull.subjectType"]).to.equal("account");
          expect(access_token["io.hull.asUser"]).to.eql({ id: user.id, email: user.email });
          expect(access_token["io.hull.asAccount"]).to.eql({ domain: user.domain });

          done();
        });
      });
    });

    it("should send account traits to the firehose", (done) => {
      const code = "hull.account().traits({ name: \"Hull\"});";

      minihull.stubConnector({ id: "123456789012345678901234", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", { user }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql({ name: "Hull" });

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("account");
          expect(access_token["io.hull.asUser"]).to.eql({ id: user.id, email: user.email });
          expect(access_token).to.not.have.property("io.hull.asAccount");

          done();
        });
      });
    });

    it("should group user traits", (done) => {
      const code = `
        if (user.clearbit_company) {
          hull.account().traits(user.clearbit_company, { group: "clearbit" });
        }`;

      const user2 = {
        id: "58b68d0f11111ef19e00df43",
        email: "thomas@hull.io",
        domain: "hull.io",
        "clearbit_company/name": "Hull"
      };

      minihull.stubConnector({ id: "123456789012345678901237", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901237", "http://localhost:8000/notify", "user_report:update", { user: user2 }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql({ name: "Hull" });

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("account");

          done();
        });
      });
    });

    it("should group account traits", (done) => {
      const code = `
        if (account.clearbit) {
          hull.account().traits({ foo: "bar" });
        }`;

      const user1 = {
        id: "58b68d0f11111ef19e00df43",
        email: "thomas@hull.io",
        domain: "hull.io",
        account: {
          id: "1234",
          "clearbit/name": "Hull"
        }
      };

      minihull.stubConnector({ id: "123456789012345678901238", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901238", "http://localhost:8000/notify", "user_report:update", { user: user1 }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql({ foo: "bar" });

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("account");

          done();
        });
      });
    });
  });

  /*
  describe("regression tests on production code", () => {
    it("should have the same result than appcues production version", (done) => {
      const namespace = "appcues";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      minihull.stubConnector({ id: "123456789012345678901234", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", { user: message }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql(traits);

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("user");
          expect(access_token.sub).to.eql(message.user.id);
          expect(access_token).to.not.have.property("io.hull.asAccount");

          done();
        });
      });
    });

    it("should have the same result than lengow production version", (done) => {
      const namespace = "lengow";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      minihull.stubConnector({ id: "123456789012345678901234", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", { user: message }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql(traits);

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("user");
          expect(access_token.sub).to.eql(message.user.id);
          expect(access_token).to.not.have.property("io.hull.asAccount");

          done();
        });
      });
    });

    it("should have the same result than mention production version", (done) => {
      const namespace = "mention";
      const path = `specs/fixtures/${namespace}`;

      if (!fs.existsSync(path)) return done();

      const code = fs.readFileSync(`${path}/code.js`, "utf8");
      const message = JSON.parse(fs.readFileSync(`${path}/user.json`, "utf8"));
      const traits = JSON.parse(fs.readFileSync(`${path}/result.json`, "utf8")).traits;

      minihull.stubConnector({ id: "123456789012345678901234", private_settings: { code } });
      minihull.notifyConnector("123456789012345678901234", "http://localhost:8000/notify", "user_report:update", { user: message }).then(() => {
        minihull.on("incoming.request@/api/v1/firehose", (req) => {
          // traits
          const body = req.body.batch[0].body;
          expect(body).to.eql(traits);

          // claims
          const access_token = jwtDecode(req.body.batch[0].headers["Hull-Access-Token"]);
          expect(access_token["io.hull.subjectType"]).to.equal("user");
          expect(access_token.sub).to.eql(message.user.id);
          expect(access_token).to.not.have.property("io.hull.asAccount");

          done();
        });
      });
    });
  });
  */
});
