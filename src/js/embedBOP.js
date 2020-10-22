import { h, render, Fragment } from "preact";
import gopher from "./components/gopher";
import $ from "./lib/qsa";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";
import DateFormatter from "./components/dateFormatter";

import Sidechain from "@nprapps/sidechain";
var guest = Sidechain.registerGuest();

gopher.watch("./data/bop.json", init);

var winnerIcon =
  `<span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>`;

async function init(results) {
  var president = {
    Dem: 0,
    GOP: 0,
    Other: 0,
    winner: ""
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

  results.president.forEach(function(r) {
    president[r.party] += r.electoral;
    if (r.winner == "X") president.winner = r.last;
  });
  results.house.forEach(r => house[r.winner] += 1);
  results.senate.forEach(r => senate[r.winner] += 1);

  var container = $.one("main.embed-bop");

  var template = <>

    <h3>President</h3>
    <div class="chatter"><strong>270</strong> electoral votes needed to win</div>
    <div class="pres-container">
      <div class="candidate">
        <div class="name">Biden {president.winner == "Biden" ? "✔" : ""}</div>
        <div class="votes dem">{president.Dem}</div>
      </div>
      <div class="candidate">
        <div class="name">Trump {president.winner == "Trump" ? "✔" : ""}</div>
        <div class="votes gop">{president.GOP}</div>
      </div>
      <div class="candidate">
        <div class="name">Other {president.winner == "Other" ? "✔" : ""}</div>
        <div class="votes other">{president.Other}</div>
      </div>
      <div class="candidate">
        <div class="name">Uncalled</div>
        <div class="votes">{538 - president.Dem - president.GOP - president.Other}</div>
      </div>
    </div>

    <div class="divider" />

    <h3>House</h3>
    <div class="chatter"><strong>218</strong> seats needed for majority</div>
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (house.Dem / 435 * 100) + "%"}>
        <div class="label">Dem. {house.Dem >= 218 ? "✔" : ""}<span>{house.Dem}</span></div>
      </div>
      <div class="bar other" style={"width: " + (house.Other / 435 * 100) + "%"}>
        <div class="label">Ind. {house.Other >= 218 ? "✔" : ""}<span>{house.Other}</span></div>
      </div>
      <div class="bar gop" style={"width: " + (house.GOP / 435 * 100) + "%"}>
        <div class="label">GOP {house.GOP >= 218 ? "✔" : ""}<span>{house.GOP}</span></div>
      </div>
      <div class="middle"></div>
    </div>

    <h3>Senate</h3>
    <div class="chatter"><strong>51</strong> seats needed for majority</div>
    <div class="bar-container">
      <div class="bar dem" style={"width: " + (senate.Dem) + "%"}>
        <div class="label">Dem. {senate.Dem >= 51 ? "✔" : ""}<span>{senate.Dem}</span></div>
      </div>
      <div class="bar other" style={"width: " + (senate.Other) + "%"}>
        <div class="label">Ind. {senate.Other >= 51 ? "✔" : ""}<span>{senate.Other}</span></div>
      </div>
      <div class="bar gop" style={"width: " + (senate.GOP) + "%"}>
        <div class="label">GOP {senate.GOP >= 51 ? "✔" : ""}<span>{senate.GOP}</span></div>
      </div>
      <div class="middle"></div>
    </div>

    <div class="source">Source: AP (as of <DateFormatter value={results.latest} />)</div>

  </>;
  
  render(template, container);
}