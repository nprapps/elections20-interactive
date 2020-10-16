// require("./lib/pym");

import $ from "./lib/qsa";
import { h, render, Fragment } from "preact";

import Sidechain from "@nprapps/sidechain";
var guest = Sidechain.registerGuest();

import './nav.js';

import App from "./app.js";

var appContainer = $.one(".app");

if (appContainer) {
  render(<App />, appContainer);
}

// lifetime for about box supression
var SUPPRESS = 3 * 60 * 60; // three hours
var COOKIE = "suppress-about-box";

var hideBox = function() {
  $.one(".about-box").classList.add("closed");
  document.cookie = `${COOKIE}=true;max-age=${SUPPRESS}`;
}

// hide about box on click
$.one(".about-box .close").addEventListener("click", hideBox);

// check the cookie and hide if found
if (document.cookie.indexOf(COOKIE) > -1) hideBox();