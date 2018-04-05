const { expect } = require("chai");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");
const jwtDecode = require("jwt-decode");

const bootstrap = require("./support/bootstrap");

describe("request feature allowing to call external API", () => {
  let minihull;
  let server;
  let externalApi;
  let errorHttpCodes = [400, 401, 403, 404, 429, 500, 501, 503];

  const user = {
    id: "58b68d0f11111ef19e00df43",
    email: "thomas@hull.io",
    domain: "hull.io"
  };

  const user2 = {
    id: "51b68d0f11111ef19e00df11",
    email: "john@hull.io",
    domain: "hull.io"
  };

  beforeEach((done) => {
    minihull = new Minihull();

    /**
     * server timeout 100ms
     */
    server = bootstrap(100);
    externalApi = new MiniApplication();

    minihull.listen(8001);

    externalApi.stubApp("/endpoint_delayed_response").respond((req, res) => {
      setTimeout(() => {
        res.end();
      }, 150);
    });

    externalApi.stubApp("/endpoint_http_error_code").respond((req, res) => {
      res.status(req.query.http_code).end("error");
    });

    externalApi.stubApp("/endpoint_success_return_email").respond((req, res) => {
      setTimeout(() =>{
        res.json({ returned_email: req.query.email });
      }, 20);
    });

    externalApi.listen(8002)

    setTimeout(() => {
      done();
    }, 1000);
  });

  afterEach(() => {
    minihull.close();
    server.close();
    externalApi.close();
  });

  errorHttpCodes.forEach((httpCode) => {
    it(`should not throw an error even when external endpoint returns http error code ${httpCode}`, () => {
      const code = `
        return new Promise((resolve, reject) => {
          request("http://localhost:8002/endpoint_http_error_code?http_code=${httpCode}", (err, response, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        });
      `;

      return minihull.smartNotifyConnector(
        { id: "123456789012345678901235", private_settings: { code } },
        "http://localhost:8000/smart-notifier",
        "user:update",
        [{ user }]
      ).then((res) => {
        expect(res.statusCode).eq(200);
        expect(res.body.flow_control.type).eq("next");
      });
    });
  });

  it("should return http 503 - gateway timeout in case of 3rd part API timeout", () => {
    const code = `
      return new Promise((resolve, reject) => {
        request("http://localhost:8002/endpoint_delayed_response", (err, response, body) => {
          if (err) {
            return reject(err);
          }
          resolve(body);
        });
      });
    `;

    return minihull.smartNotifyConnector(
      { id: "123456789012345678901235", private_settings: { code } },
      "http://localhost:8000/smart-notifier",
      "user:update",
      [{ user }]
    ).then((res) => {
      expect(true).to.be.false;
    }, (e) => {
      expect(e.constructor.name).eq("Error");
      expect(e.status).eq(503);
      expect(e.response.body.flow_control.type).eq("next");
    });
  });

  it("should allow for multiple concurrent calls for multiple users", (done) => {
    const code = `
      return new Promise((resolve, reject) => {
        request("http://localhost:8002/endpoint_success_return_email?email="+user.email, (err, response, body) => {
          if (err) {
            return reject(err);
          }
          traits(JSON.parse(body));
          resolve(body);
        });
      });
    `;

    minihull.smartNotifyConnector(
      { id: "123456789012345678901235", private_settings: { code } },
      "http://localhost:8000/smart-notifier",
      "user:update",
      [{ user }, { user: user2 }]
    );

    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      expect(req.body.batch[0].body).to.eql({ returned_email: "john@hull.io" });
      expect(jwtDecode(req.body.batch[0].headers["Hull-Access-Token"])["io.hull.asUser"])
        .to.eql({ id: "51b68d0f11111ef19e00df11", email: "john@hull.io" });

      expect(req.body.batch[1].body).to.eql({ returned_email: "thomas@hull.io" });
      expect(jwtDecode(req.body.batch[1].headers["Hull-Access-Token"])["io.hull.asUser"])
        .to.eql({ id: "58b68d0f11111ef19e00df43", email: "thomas@hull.io" });
      done();
    });
  });
});
