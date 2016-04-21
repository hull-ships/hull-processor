import compute from './compute';
import _ from 'lodash';

export default function handle({ message }, { ship, hull }) {
  try {
    const { user, segments } = message;
    const { changes } = compute(message, ship);

    if (process.env.DEBUG) {
      console.warn("Apply traits: ", user.id, user.email, JSON.stringify(changes));
    }
    if (!_.isEmpty(changes)) {
      hull.as(user.id).traits(changes, {source: 'computed'});
    }
  } catch(err) {
    console.warn('error in compute: ', { err, user, segments });
  }

}
