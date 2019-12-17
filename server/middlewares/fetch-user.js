const _ = require("lodash");
const Promise = require("bluebird");

const { EXCLUDED_EVENTS } = require("../lib/shared");

const PROP_TYPE_DETECT_ORDER = [
  "bool_value",
  "date_value",
  "num_value",
  "text_value"
];

const unflatify_context = require("../lib/utils/unflatify-context");

const isVisible = e => !_.includes(EXCLUDED_EVENTS, e.event);

function getEventsForUserId(client, user_id) {
  if (!user_id || !client) return Promise.reject();
  const params = {
    query: {
      has_parent: {
        parent_type: "user_report",
        query: { term: { id: user_id } }
      }
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
          return _.map(_.filter(esEvents, isVisible), (e) => {
            const {
              context = {},
              props = {},
              event,
              created_at,
              source,
              type
            } = e;
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
              context: unflatify_context(context)
            };
          });
        }
      } catch (e) {
        client.logger.error("fetch.user.events.error", e.message);
      }
      return [];
    });
}

function getEventsAndSegments(client, user) {
  const promises = [
    getEventsForUserId(client, user.id),
    client
      .get(`${user.id}/segments`)
      .catch(e => client.logger.error("fetch.user.segments.error", e.message))
  ];
  if (user.account && user.account.id) {
    promises.push(client
      .get(`${user.account.id}/segments`)
      .catch(e =>
        client.logger.error("fetch.account.segments.error", e.message)));
  }
  return Promise.all(promises).then((results = []) => {
    const [events = [], segments = [], account_segments = []] = results;
    return {
      user,
      segments,
      events,
      account_segments
    };
  });
}

function getUserById(client, userId) {
  return client
    .get(`${userId}/user_report`)
    .then(user => getEventsAndSegments(client, user));
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
    "contact_email.exact",
    "external_id.raw"
  ].map((key) => {
    return { term: { [key]: query } };
  });

  if (query) {
    params.query = { bool: { should, minimum_should_match: 1 } };
  }

  return client
    .post("search/user_reports", params)
    .then((res = {}) => {
      const fieldsToOmit = ["_id", "_type", "_index", "_score"];
      const user = _.omit(res.data && res.data[0], fieldsToOmit);
      if (!user) throw new Error("User not found");
      return getEventsAndSegments(client, user);
    })
    .catch(e => client.logger.error("fetch.user.segments.error", e.message));
}

/*
 * returns a sample set of 3 keys picked at random in the source object to simulate a changes object.
 * We are omitting `account` and `segment_ids` from this preview changes object.
 *
 * @param  {User|Account payload} source a User or Account, flat format (not grouped)
 * @return {Object}        A user change or account change dummy object to simulate one that we would receive with actual notifications
 */
const getSample = source =>
  _.reduce(
    _.sampleSize(_.omit(_.keys(source), "account", "segment_ids"), 3),
    (m, k) => {
      m[k] = [null, source[k]];
      m.THOSE_ARE_FOR_PREVIEW_ONLY = [null, "fake_values"];
      return m;
    },
    {}
  );

const formatSegment = s =>
  _.pick(s, "id", "name", "type", "updated_at", "created_at");

module.exports = function fetchUser(req, res, next) {
  const startAt = new Date();

  req.hull = req.hull || { timings: {} };
  req.hull.timings = req.hull.timings || {};

  const { client } = req.hull;

  const body = req.body || {};
  const { userId, userSearch } = body;

  const existingPayload = _.get(body, "payload");
  // this is a workaround since we are getting account from user later on
  // and the preview does not have it
  if (existingPayload) {
    existingPayload.account = _.get(body, "payload.account");
  }
  let userPromise = Promise.resolve(existingPayload);

  if (client && !existingPayload) {
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
      const segments = _.map(payload.segments, formatSegment);
      const accountSegments = _.map(payload.account_segments, formatSegment);
      const groupedUser = client.utils.groupTraits(payload.user);
      const account = client.utils.groupTraits(groupedUser.account);
      const changes = {
        account: getSample(payload.user.account),
        user: getSample(payload.user),
        is_new: false,
        segments: {
          entered: [_.first(segments)],
          left: [_.last(segments)]
        },
        account_segments: {
          entered: [_.first(accountSegments)],
          left: [_.last(accountSegments)]
        }
      };
      req.hull.user = {
        changes,
        ...payload,
        segments,
        account_segments: accountSegments,
        account,
        user: _.omit(groupedUser, "account")
      };
      return req.hull.user;
    })
    .then(done, (err) => {
      client.logger.error("fetch.user.error", err.message);
      res.status(404);
      res.send({ reason: "user_not_found", message: (err && err.message) });
      return res.end();
    });
};
