import Promise from 'bluebird';


function getUserById(client, userId) {
  return Promise.all([
    client.get(userId + '/user_report'),
    client.as(userId).get(userId + '/segments')
  ]).then(results => {
    return { user: results[0], segments: results[1] };
  });
}


function searchUser(client, query) {
  const params = {
    query: {
      match_all: {}
    },
    raw: true,
    page: 1,
    per_page: 1
  };

  if (query) {
    params.query = { multi_match: {
      query,
      fields: [
        'name',
        'name.exact',
        'email',
        'email.exact',
        'contact_email',
        'contact_email.exact'
      ]
    } };
  }
  return new Promise((resolve, reject) => {
    client.post('search/user_reports', params).then(res => {
      return res.data[0];
    }, reject).then(user => {
      if (!user) return reject(new Error('User not found'));
      client.as(user.id, false).get(user.id + '/segments').then(segments => {
        resolve({ user, segments });
      }, reject);
    })
  });
}


export default function fetchUser(req, res, next) {
  const startAt = new Date();
  req.hull = req.hull || { timings: {} };
  req.hull.timings = req.hull.timings || {};
  const { client } = req.hull;
  const { userId, userSearch, user } = req.body || {};
  let userPromise = Promise.resolve(user);

  if (client && !user) {
    userPromise = userId ? getUserById(client, userId) : searchUser(client, userSearch);
  }

  function done() {
    req.hull.timings.fetchUser = new Date() - startAt;
    next();
  }

  return userPromise.then((user) => {
    req.hull.user = user;
  }).then(done, (err) => {
    res.status(404);
    res.send({ reason: 'user_not_found', message: err.message });
    res.end();
  });
}
