/* global Hull */
import { queryParams } from "./utils";
import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
import superagent from "superagent";
import Promise from "bluebird";
import Engine from "./engine";

(function main() {
  const { ship, organization, secret } = queryParams();

  Hull.init({
    appId: ship,
    orgUrl: `https://${organization}`
  });

  Hull.ready((hull, currentUser, app) => {
    const root = document.getElementById("app");
    const engine = new Engine({ ship, organization, secret }, { ship: app, currentUser });

    window.addEventListener("message", ({ data: message }) => {
      if (message && message.event === "ship.update" && message.ship) {
        engine.updateShip(message.ship);
      }
    });
    ReactDOM.render(<App engine={engine} />, root);
  });
}());
