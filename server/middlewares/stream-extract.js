import request from 'request';
import JSONStream from 'JSONStream';
import es from 'event-stream';
import Promise from 'bluebird';
import _ from 'lodash';

export default function(handler) {

  return (req, res, next) => {

    const { url } = req.body || {};
    const { client, ship } = req.hull;

    if (url && client && ship) {
      client.get('segments', { limit: 500 }).then((segments_list) => {
        const segments = segments_list.reduce((ss,s) => {
          ss[s.id] = s;
          return ss;
        }, {});

        function getSegments(ids=[]) {
          return ids.map ? ids.map(id => segments[id]) : [];
        }

        return request({ url })
          .pipe(JSONStream.parse())
          .pipe(es.mapSync(function (data) {
            const segments = getSegments(data.segment_ids || []);
            const user = _.omit(data, 'segment_ids');

            if (process.env.DEBUG) {
              console.warn('[batch] ', { id: user.id, email: user.email });
            }

            return handler && handler({ message: { user, segments } }, { hull: client, ship });
          }));
      });
      next();
    } else {
      res.status(400);
      res.send({ reason: 'missing_params' });
      res.end();
    }
  }
}
