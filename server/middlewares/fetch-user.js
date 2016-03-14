export default function fetchUser(req, res, next) {
  req.hull = req.hull || {};
  const { client, ship } = req.hull;
  let { userId, userSearch, user } = req.body || {};

  if (!user && client) {
    let userPromise;

    if (userId) {
      console.warn("Getting user with ID", userId)
      userPromise = client.get(userId + '/user_report')
    } else {

      const params = {
        query: {
          match_all: {}
        },
        raw: true,
        page: 1,
        per_page: 1
      };

      if (userSearch) {
        params.query = { multi_match: {
          query: userSearch,
          fields: ["name", "name.exact", "email", "email.exact", "contact_email", "contact_email.exact"]
        } };
      }

      console.warn("Searching user with email", {userSearch, params: JSON.stringify(params)})

      userPromise = client.post('search/user_reports', params).then(res => {
        return res.data[0];
      }, (err) => {
        console.warn("Oooula", err);
        throw err;
      })
    }

    userPromise.then((user) => {
      return client.get(user.id + '/segments').then((segments) => {
        console.warn("And his segments: ", segments)
        req.hull.user = { user, segments };
        next();
      }, err => {
        console.warn("Oupla. pas de segments ?", err)
        next();
      })
    }).catch((err) => {
      console.warn('oopss', err);
      next()
    });

 } else {
    if (user) {
      req.hull.user = user
    }
    next();
  }
}
