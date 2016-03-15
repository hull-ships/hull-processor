import _ from 'lodash';
import { EventEmitter } from 'events';
import superagent from 'superagent';

const EVENT = 'CHANGE';

export default class Engine extends EventEmitter {

  constructor(config, { ship, currentUser }) {
    super();
    this.config = config;
    const userId = currentUser && currentUser.id;
    this.state = { ship: ship, loading: false };
    this.compute = _.debounce(this.compute, 500);
    this.compute({ ship, userId });
  }

  setState(changes) {
    this.state = Object.assign({}, this.state, changes);
    this.emitChange();
    return this.state;
  }

  getState() {
    return this.state;
  }

  addChangeListener(listener) {
    this.addListener(EVENT, listener);
  }

  removeChangeListener(listener) {
    this.removeListener(EVENT, listener);
  }

  emitChange() {
    this.emit(EVENT);
  }

  searchUser(userSearch) {
    this.compute({ userSearch, ship: this.state.ship });
  }

  updateShip(ship) {
    this.compute({ ship, user: this.state.user });
  }

  compute(params) {
    if (this.state.loading) return false;
    this.setState({ loading: true });
    if (this.computing) {
      this.computing.abort();
    }
    this.computing = superagent.post('/compute')
      .query(this.config)
      .send(params)
      .accept('json')
      .end((error, response) => {
        this.computing = false;
        if (error) {
          this.setState({ error });
        } else {
          const { ship, user, result, took } = response.body;
          this.setState({
            loading: false,
            initialized: true,
            ship, user, result, took, error
          });
        }
      });
  }

}
