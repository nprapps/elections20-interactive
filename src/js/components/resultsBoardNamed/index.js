import { h, Fragment } from "preact";
import { reportingPercentage, sortByParty } from "../util";
import states from "states.sheet.json";

import "./resultsBoard.less";

function CandidateCells(race) {
  var sorted = race.candidates.slice(0, 2).sort(sortByParty);
  var leading = race.candidates[0];
  var reporting = race.eevp || race.reportingPercent;

  return sorted.map(function(c) {
    var className = ["candidate", c.party];
    if (reporting > .5 && c == leading) className.push("leading");
    if (c.winner == "X") className.push("winner");
    if (race.runoff) className.push("runoff");

    return (
      <td class={className.join(" ")}>
        <div class="perc">{Math.round(c.percent*100)}%</div> <div class="name">{c.last} {c.incumbent ? <span>●</span> : ""}</div>
      </td>
    );
  });
}

export default function ResultsBoardNamed(props) {

  return (
    <>
      <div>
        <h3 class="board-hed">{props.hed}</h3>
        <table class="named results table">
          {props.races.map(function(r) {
            var hasResult = r.eevp || r.reporting || r.called || r.runoff;
            var reporting = r.eevp || r.reportingPercent;
            var percentIn = reporting ? reportingPercentage(reporting) + "% in" : "";
            var winner = r.candidates.filter(c => c.winner == "X");

            return (
              <tr class={hasResult ? "closed" : "open"}>

                {/* State */}
                <td class={"state " + (winner[0] ? ("winner " + winner[0].party) : "")}>
                  <a href={"#/states/" + r.state + "/" + r.office}>
                    {states[r.state].ap} {r.seatNumber && !r.description.includes("at large") ? r.seatNumber : ""}
                  </a>
                </td>

                {/* Open */}
                <td class="open-label" colspan="3">Last polls close at {states[r.state].closingTime} ET</td>

                {/* Candidates */}
                {CandidateCells(r)}

                {/* EEVP */}
                <td class="reporting">{percentIn}</td>

                {/* Runoff */}
                <td class="runoff-label">{r.runoff ? "Runoff" : ""}</td>
              </tr>
            );
          })}
        </table>
      </div>
    </>
  )
}