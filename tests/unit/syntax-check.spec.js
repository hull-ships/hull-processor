const syntaxChecker = require("../../server/lib/utils/syntax-check");
const { expect } = require("chai");

describe("syntax-check", () => {
  it("should pass if there are no syntactical errors in the code", () => {
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
    const syntaxCheckResult = syntaxChecker(code);
    expect(syntaxCheckResult).to.be.undefined; // eslint-disable-line 
  });

  it("should not pass if there are syntactical errors in the code", () => {
    const code = `
            const segmentName = "SFDC FB Audience";

            if(segmentName !== "foo") 
              console.log("baz");
            }
            
        `;
    const syntaxCheckResult = syntaxChecker(code);
    expect(syntaxCheckResult.annotated).to.eql("\n(anonymous file):12\n        }())\n        ^\nParseError: Unexpected token");
  });
});
