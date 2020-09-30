// require("./lib/pym");

import $ from "./lib/qsa";
import { h, render, Fragment } from "preact";

import { BigBoardCore } from "./includes/big-board-core.js";
import App from "./app.js";

var appContainer = $.one(".app");

if (appContainer) {
  render(<App />, appContainer);
}

// accessible menu toggles
$(".menu-toggle").forEach(function(button) {
  var controls = button.getAttribute("aria-controls");
  var menu = $.one("#" + controls);

  button.setAttribute("aria-expanded", "false");
  
  // enable click behavior for the toggle button
  button.addEventListener("click", function(e) {
    var shown = menu.classList.toggle("show");
    button.setAttribute("aria-expanded", shown);
    // menu.querySelector("a").focus();
    e.stopPropagation();
  });

  // hide menu on click
  menu.addEventListener("click", function() {
    menu.classList.remove("show");
  });

  // hide menu on escape
  var onEsc = function(e) {
    if (e.code == "Escape") {
      menu.classList.remove("show");
      button.focus();
    }
  };

  [button, menu].forEach(el => el.addEventListener("keyup", onEsc));

  // hide menu on blur
  menu.addEventListener("focusout", function(e) {
    setTimeout(function() {
      console.log(document.activeElement, menu.contains(document.activeElement));
      if (!menu.contains(document.activeElement)) menu.classList.remove("show");
    }, 300);
  });

  button.addEventListener("focusout", function(e) {
    setTimeout(function() {
      if (!menu.contains(document.activeElement)) menu.classList.remove("show");
    })
  });
});