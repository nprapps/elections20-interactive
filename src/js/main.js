// require("./lib/pym");

import $ from "./lib/qsa";
import { h, render, Fragment } from "preact";

import './nav.js';

import App from "./app.js";

var appContainer = $.one(".app");

if (appContainer) {
  render(<App />, appContainer);
}

// hide about box on click
$.one(".about-box .close").addEventListener("click", function() {
	$.one(".about-box").classList.add("closed");
});