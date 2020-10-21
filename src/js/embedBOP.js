import { h, render, Fragment } from "preact";
import $ from "./lib/qsa";
import inactiveSenate from "inactive_senate_races.sheet.json";

// import Sidechain from "@nprapps/sidechain";
// var guest = Sidechain.registerGuest();

init();

async function init() {
  var response = await fetch(`./data/bop.json`);
  var results = await response.json();

  var president = {
    Dem: 0,
    GOP: 0,
    Other: 0
  }
  var house = {
    Dem: 0,
    GOP: 0,
    Other: 0
  }
  var senate = {
    Dem: inactiveSenate.Dem,
    GOP: inactiveSenate.GOP,
    Other: inactiveSenate.Other
  }

  results.president.forEach((r) => president[r.party] += r.electoral);
  results.house.forEach((r) => house[r.winner] += 1);
  results.senate.forEach((r) => senate[r.winner] += 1);

  var container = $.one("main.embed-bop");
  var template = <>
    <div>{president.Dem} Biden</div>
    <div>{president.GOP} Trump</div>
    {president.Other ? <div>{president.Other}</div> : ""}
  </>;
  
  render(template, container);
}