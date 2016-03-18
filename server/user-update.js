import compute from './compute';
import _ from 'lodash';

export default function handle({ message }, { ship, hull }) {
  const { user, segments } = message;
  const { changes } = compute(message, ship);

  if (!_.isEmpty(changes)) {
    if (process.env.DEBUG) {
      console.warn("Apply traits: ", user.id, user.email, JSON.stringify(changes));
    }
    hull.as(user.id).traits(changes);
  }
}
