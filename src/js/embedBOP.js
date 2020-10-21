import { h, render, Fragment } from "preact";
import gopher from "./components/gopher";
import $ from "./lib/qsa";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";
import DateFormatter from "./components/dateFormatter";

import Sidechain from "@nprapps/sidechain";
var guest = Sidechain.registerGuest();

gopher.watch("./data/bop.json", init);

async function init(results) {
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
    Dem: InactiveSenateRaces.Dem,
    GOP: InactiveSenateRaces.GOP,
    Other: InactiveSenateRaces.Other
  }

  console.log(results)

  results.president.forEach((r) => president[r.party] += r.electoral);
  results.house.forEach((r) => house[r.winner] += 1);
  results.senate.forEach((r) => senate[r.winner] += 1);

  var container = $.one("main.embed-bop");

  var template = <>

    President:
    <div>{president.Dem} Biden</div>
    <div>{president.GOP} Trump</div>
    {president.Other ? <div>{president.Other} Other</div> : ""}

    House:
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (house.Dem / 435 * 100) + "%"}></div>
      <div class="bar other" style={"width: " + (house.Other / 435 * 100) + "%"}></div>
      <div class="bar gop" style={"width: " + (house.GOP / 435 * 100) + "%"}></div>
      <div class="middle"></div>
    </div>

    Senate:
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (senate.Dem) + "%"}></div>
      <div class="bar other" style={"width: " + (senate.Other) + "%"}></div>
      <div class="bar gop" style={"width: " + (senate.GOP) + "%"}></div>
      <div class="middle"></div>
    </div>

    Source: AP (as of <DateFormatter value="TK" />)

  </>;
  
  render(template, container);
}