import compute from './compute';

export default function handle({ message }, { ship, hull }) {
  const { user, segments } = message;
  const { changes } = compute(message, ship);

  if (!_.isEmpty(changes)) {
    hull.as(user.id).traits(changes).then((res) => {
      console.warn("CHANGES ", res)
    });
  } else {
    console.warn("Nothing changed !");
  }
}
