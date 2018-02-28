const lint = require("../../server/lib/utils/lint-code");
const { expect } = require("chai");

describe("linter", () => {
  it("should properly lint code using the request library", () => {
    const code = `
            const segmentName = "SFDC FB Audience";

            const performRequest = (email) => {
            const opts = {
                method: "POST",
                url: 'https://person.clearbit.com/v1/audiences/facebook?email=dummy@test.io'
            };
            
            return new Promise((reject, resolve) => {
                request(opts, (error, response, body) => {
                if (error) {
                    console.log("Failed to execute request", error);
                    return reject(error);
                }
                resolve(body);
                });
            });
            }

            if(isInSegment(segmentName)) {
                return performRequest(user.email).then(res => {
                console.log(res);
            });
            
            }
        `;

    const messages = lint(code);
    expect(messages.length).to.equal(0);
  });
});
