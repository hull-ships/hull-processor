import _ from "lodash";
import Promise from "bluebird";

const PROP_TYPE_DETECT_ORDER = [
  "bool_value",
  "date_value",
  "num_value",
  "text_value"
];

function getEventsForUserId(client, user_id) {
  if (!user_id || !client) return Promise.reject();
  const params = {
    query: {
      term: { _parent: user_id }
    },
    sort: { created_at: "desc" },
    raw: true,
    page: 1,
    per_page: 50
  };

  return client
    .post("search/events", params)
    .catch((error) => {
      return { data: [], error };
    })
    .then((res = {}) => {
      try {
        const esEvents = res.data;
        if (esEvents.length) {
          return _.map(esEvents, (e) => {
            const {
              context = {},
              props = {},
              event,
              created_at,
              source,
              type
            } = e;
            const { location = {} } = context;
            const properties = _.reduce(
              props,
              (pp, p) =>
                _.set(
                  pp,
                  p.field_name,
                  _.get(
                    p,
                    _.find(PROP_TYPE_DETECT_ORDER, _.has.bind(undefined, p))
                  )
                ),
              {}
            );
            return {
              event,
              created_at,
              properties,
              event_source: source,
              event_type: type,
              context: {
                location: {
                  latitude: location.lat,
                  longitude: location.lon
                },
                page: {
                  url: context.page_url
                }
              }
            };
          });
        }
      } catch (e) {
        client.logger.error("fetch.user.events.error", e.message);
      }
      return [];
    });
}

function getUserById(client, userId) {
  return Promise.all([
    client.get(`${userId}/user_report`),
    client.asUser(userId, false).get(`${userId}/segments`),
    getEventsForUserId(client, userId)
  ]).then((results = []) => {
    const [user = {}, segments = [], events = []] = results;
    return { user, segments, events };
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

  const should = [
    "id",
    "name",
    "name.exact",
    "email",
    "email.exact",
    "contact_email",
    "contact_email.exact"
  ].map((key) => {
    return { term: { [key]: query } };
  });

  if (query) {
    params.query = { bool: { should, minimum_should_match: 1 } };
  }

  return new Promise((resolve, reject) => {
    client.post("search/user_reports", params).then(
      (res = {}) => {
        const user = res.data && res.data[0];
        if (!user) return reject(new Error("User not found"));
        const { id } = user;
        return Promise.all([
          client
            .asUser(id, false)
            .get(`${id}/segments`)
            .catch(e =>
              client.logger.error("fetch.user.segments.error", e.message)),
          getEventsForUserId(client, id)
        ]).then((results) => {
          const [segments = [], events = []] = results;
          return resolve({ user, segments, events }, reject);
        });
      },
      e => client.logger.error("fetch.user.report.error", e.message)
    );
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
    userPromise = userId
      ? getUserById(client, userId)
      : searchUser(client, userSearch);
  }

  function done() {
    req.hull.timings.fetchUser = new Date() - startAt;
    next();
  }

  return userPromise
    .then((payload = {}) => {
      const segments = _.map(payload.segments, s =>
        _.pick(s, "id", "name", "type", "updated_at", "created_at"));
      const randKeys = _.sampleSize(_.keys(payload.user), 3);
      const changes = {
        user: _.reduce(
          randKeys,
          (m, k) => {
            m[k] = [null, payload.user[k]];
            m.THOSE_ARE_FOR_PREVIEW_ONLY = [null, "fake_values"];
            return m;
          },
          {}
        ),
        is_new: false,
        segments: {
          entered: [_.first(segments)],
          left: [_.last(segments)]
        }
      };
      const groupedUser = client.utils.groupTraits(payload.user);
      req.hull.user = {
        changes,
        ...payload,
        segments,
        user: _.omit(groupedUser, "account"),
        account: client.utils.groupTraits(groupedUser.account)
      };
      return req.hull.user;
    })
    .then(done, (err) => {
      client.logger.error("fetch.user.error", err.message);
      res.status(404);
      res.send({ reason: "user_not_found", message: err.message });
      return res.end();
    });
}
