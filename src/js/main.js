// require("./lib/pym");

import $ from "./lib/qsa";
import { h, render, Fragment } from "preact";

import { GetCaughtUp } from "./includes/get-caught-up.js";
import { BigBoardCore } from "./includes/big-board-core.js";
import App from "./app.js";


$(".big-board").forEach(function(board) {
  var json = board.dataset.source;
  var title = board.dataset.title;

  render(<BigBoardCore json="{json}" title="{title}"/>, board);
});

$(".get-caught-up-wrapper").forEach(function(gcu) {
  render(<GetCaughtUp />, gcu);
});

var app = $.one(".app");

if (app) {
  render(<App />, app);
}