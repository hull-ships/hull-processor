import _ from "lodash";
import { EventEmitter } from "events";
import superagent from "superagent";

const EVENT = "CHANGE";

export default class Engine extends EventEmitter {

  constructor(config, { ship, userSearch }) {
    super();
    this.config = config;
    this.state = { ship, loading: false };
    this.compute({ ship, userSearch });
    this.compute = _.debounce(this.compute, 1000);
    this.updateParent = _.debounce(this.updateParent, 1000);
  }

  setState(changes) {
    this.state = { ...this.state, ...changes };
    this.emitChange();
    return this.state;
  }

  getState() {
    return this.state || {};
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
    this.compute({ ship, payload: this.state.payload });
  }

  updateParent(code) {
    if (window.parent) {
      window.parent.postMessage(JSON.stringify({
        from: "embedded-ship",
        action: "update",
        ship: { private_settings: { code } }
      }), "*");
    }
  }
  updateCode(code) {
    const { ship } = this.state || {};
    if (!ship || !ship.id) return;
    const newShip = {
      ...ship,
      private_settings: {
        ...ship.private_settings,
        code
      }
    };
    this.updateParent(code);
    this.setState({ ship: newShip });
    this.compute({
      ship: newShip,
      payload: this.state.payload
    });
  }

  compute(params) {
    if (this.state.loading) return false;
    this.setState({ loading: true });

    if (this.computing) {
      this.computing.abort();
    }
    this.computing = superagent.post("/compute")
      .query(this.config)
      .send(params)
      .accept("json")
      .end((error, { body = {}, status } = {}) => {
        try {
          this.computing = false;
          if (error) {
            this.setState({
              error: { ...body, status },
              loading: false,
              initialized: true
            });
          } else {
            const { ship, payload, took, result } = body || {};

            if (params.userSearch) {
              window.localStorage.setItem(`userSearch-${this.config.ship}`, params.userSearch);
            }

            // Don't kill user code
            if (this && this.state && this.state.ship && this.state.ship.private_settings) {
              ship.private_settings.code = this.state.ship.private_settings.code;
            }

            this.setState({
              loading: false,
              initialized: true,
              error: null,
              ship, payload, result, took
            });
          }
        } catch (err) {
          this.computing = false;
          this.setState({ loading: false, error: err });
        }
      });
    return this.computing;
  }

}
