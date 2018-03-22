const { expect } = require("chai");
const jwtDecode = require("jwt-decode");
const Minihull = require("minihull");
const MiniApplication = require("mini-application");
const bootstrap = require("./support/bootstrap");
const request = require('request')

describe('process injected code which is causing http errors', () => {
    let minihull;
    let server;
    let externalApi;
    let errorHttpCodes = [ 400, 401, 403, 404, 429, 500, 501, 503 ]

    const user = {
        id: "58b68d0f11111ef19e00df43",
        email: "thomas@hull.io",
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

        externalApi.stubApp('/endpoint_delayed_response').respond((req, res) => {
            setTimeout(function(){
                res.end();
            }, 150);
        });

        externalApi.stubApp('/endpoint_http_error_code').respond((req, res) => {
            res.status(req.query.http_code).end('error')
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

    describe('call external api', () => {
        errorHttpCodes.forEach((httpCode) => {
            it(`should not return error even external endpoint returns http error code ${httpCode}`, () => {
                const code = `
                    return new Promise((resolve, reject) => {
                        request("http://localhost:8002/endpoint_http_error_code?http_code=${httpCode}", (err, response, body) => {
                            if (err) {
                                track('calling endpoint');
                                return reject(err);
                            }
                            resolve(body);
                        });
                    });
                `;

                return minihull.smartNotifyConnector(
                    { id: "123456789012345678901235", private_settings: { code } },
                    'http://localhost:8000/smart-notifier',
                    'user:update',
                    [{ user }]
                ).then((res) => {
                    expect(res.statusCode).eq(200)
                    expect(res.body.flow_control.type).eq('next')
                })
            });
        })

        it('should return http 503 - gateway timeout', () => {
            const code = `
                return new Promise((resolve, reject) => {
                    request("http://localhost:8002/endpoint_delayed_response", (err, response, body) => {
                        if (err) {
                            track('calling endpoint');
                            return reject(err);
                        }
                        resolve(body);
                    });
                });
            `;

            return minihull.smartNotifyConnector(
                { id: "123456789012345678901235", private_settings: { code } },
                'http://localhost:8000/smart-notifier',
                'user:update',
                [{ user }]
            ).then((res) => {
                expect(true).to.be.false
            }, (e) => {
                expect(e.constructor.name).eq('Error')
                expect(e.status).eq(503)
                expect(e.response.body.flow_control.type).eq('next')
            });
        });
    })
})
