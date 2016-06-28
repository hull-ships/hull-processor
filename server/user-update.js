import compute from "./compute";
import _ from "lodash";
import isGroup from "./is-group-trait";
// import _ from "lodash";

function flatten(obj, key, group) {
  return _.reduce(group, (m, v, k) => {
    const n = (key) ? `${key}/${k}` : k;
    if (isGroup(v)) {
      flatten(m, n, v);
    } else {
      m[n] = v;
    }
    return m;
  }, obj);
}

export default function handle({ message = {} }, { ship, hull }) {
  const { user, segments } = message;
  try {
    const computed = compute(message, ship);
    const { changes, events } = computed.result;
    const asUser = hull.as(user.id);

    if (_.size(changes)) {
      const flat = {
        ...flatten({}, "", _.omit(changes, "traits")),
        ...changes.traits
      };
      asUser.traits(flat);
    }

    if (events.length > 0) {
      events.map(({ eventName, properties, context }) => asUser.track(eventName, properties, context));
    }

    // hull.utils.debug("Apply traits: ", { id: user.id, email: user.email, changes: JSON.stringify(changes)})

    // console.log(flatChanges);

    // console.log(flatChanges);
    // if (!_.isEmpty(changes)) {
    //   // hull.as(user.id).traits(changes, {source: "computed"});
    // }
  } catch (err) {
    console.warn("error in compute: ", { err, user, segments });
  }
}
