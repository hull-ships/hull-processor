jest.unmock('moment');
jest.unmock('lodash');
jest.unmock('urijs');
jest.unmock('../lib/compute');

function getContext(code) {
  return {
    ship: {
      id: '456',
      name: 'I love ships',
      private_settings: { code }
    }
  };
}

function getMessage() {
  return {
    user: {
      id: '56e0577ffac81ba8ba000001',
      first_name: 'Bobby',
      last_name: 'Lapointe',
      name: 'Bobby Lapointe',
      traits_foo: 'bar',
      traits_count_dogs: 1
    },
    segments: [
      { id: '56e05785fac81ba8ba000002', name: 'My dear Friends', type: 'users_segment' }
    ]
  };
}

function computeWithCode(code) {
  const { ship } = getContext(code);
  return compute(getMessage(), ship);
}

const compute = require('../lib/compute');

describe('compute results', ()=> {

  it('compute return simple value', ()=> {
    const val = { foo: "bar", boom: "Chack" };
    const result = computeWithCode(`return ${JSON.stringify(val)};`);
    expect(result.traits).toEqual(val);
    expect(result.errors.length).toEqual(0);
    expect(result.logs.length).toEqual(0);
  });

  it('returns diff to apply', ()=> {
    const val = { foo: "bar", boom: "Chack" };
    const result = computeWithCode(`return ${JSON.stringify(val)};`);
    expect(result.changes).toEqual({ boom: "Chack" });
  });

  it('returns errors', ()=> {
    const result = computeWithCode(`booom()`);
    expect(result.traits).toEqual({});
    expect(result.errors[0]).toEqual('ReferenceError: booom is not defined');
  });

  it('isInSegment', ()=> {
    const result = computeWithCode(`return { yep: isInSegment('My dear Friends'), nope: isInSegment('nope') }`);
    expect(result.traits).toEqual({ yep: true, nope: false });
  });

  it('isToday', ()=> {
    const moment = require('moment');
    const today = moment().format('dddd');
    const result = computeWithCode(`return { today: moment().format('dddd') }`);
    expect(result.traits).toEqual({ today });
  });

  it('has lodash', ()=> {
    const moment = require('moment');
    const today = moment().format('dddd');
    const result = computeWithCode(`return { isFunction: _.isFunction('nope') }`);
    expect(result.traits).toEqual({ isFunction: false });
  });

  it('has urijs', ()=> {
    const moment = require('moment');
    const today = moment().format('dddd');
    const result = computeWithCode(`return { host: urijs('https://google.com/yeah').host() }`);
    expect(result.traits).toEqual({ host: 'google.com' });
  });

  it('uses user object', ()=> {
    const result = computeWithCode(`return { computed: [user.last_name, user.first_name].join(' ') }`);
    expect(result.traits.computed).toEqual('Lapointe Bobby');
  });

});


