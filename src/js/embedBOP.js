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

    <h3>President</h3>
    <div class="chatter"><strong>270</strong> electoral votes needed to win</div>
    <div class="pres-container">
      <div class="candidate">
        <div class="name">Biden</div>
        <div class="votes dem">{president.Dem}</div>
      </div>
      <div class="candidate">
        <div class="name">Trump</div>
        <div class="votes gop">{president.GOP}</div>
      </div>
      <div class="candidate">
        <div class="name">Other</div>
        <div class="votes other">{president.Other}</div>
      </div>
      <div class="candidate">
        <div class="name">Uncalled</div>
        <div class="votes">{538 - president.Dem - president.GOP - president.Other}</div>
      </div>
    </div>

    <div class="divider" />

    <h3>House</h3>
    <div class="chatter"><strong>51</strong> seats needed for majority</div>
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (house.Dem / 435 * 100) + "%"}>
        <div class="label">Dem. <span>{house.Dem}</span></div>
      </div>
      <div class="bar other" style={"width: " + (house.Other / 435 * 100) + "%"}>
        <div class="label">Ind. <span>{house.Other}</span></div>
      </div>
      <div class="bar gop" style={"width: " + (house.GOP / 435 * 100) + "%"}>
        <div class="label">GOP <span>{house.GOP}</span></div>
      </div>
      <div class="middle"></div>
    </div>

    <h3>Senate</h3>
    <div class="chatter"><strong>218</strong> seats needed for majority</div>
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (senate.Dem) + "%"}>
        <div class="label">Dem. <span>{senate.Dem}</span></div>
      </div>
      <div class="bar other" style={"width: " + (senate.Other) + "%"}>
        <div class="label">Ind. <span>{senate.Other}</span></div>
      </div>
      <div class="bar gop" style={"width: " + (senate.GOP) + "%"}>
        <div class="label">GOP <span>{senate.GOP}</span></div>
      </div>
      <div class="middle"></div>
    </div>

    <div class="source">Source: AP (as of <DateFormatter value={results.latest} />)</div>

  </>;
  
  render(template, container);
}