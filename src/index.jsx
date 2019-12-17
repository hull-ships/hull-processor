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
  const root = document.getElementById("app");
  const userSearch = window.localStorage.getItem(`userSearch-${ship}`);
  const engine = new Engine({ ship, organization, secret }, { ship: {}, userSearch });
  ReactDOM.render(<App engine={engine} />, root);
}());
