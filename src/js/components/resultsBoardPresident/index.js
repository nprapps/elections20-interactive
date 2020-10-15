import { h, Fragment } from "preact";
import { reportingPercentage } from "../util";
import states from "states.sheet.json";

import "../resultsBoardNamed/resultsBoard.less";

var sortParty = function(p) {
  return p == "GOP" ? Infinity : p == "Dem" ? -Infinity : 0;
};

function CandidateCells(race) {
  var sorted = race.candidates.slice(0, 2).sort((a, b) => sortParty(a.party) - sortParty(b.party));
  var leading = race.candidates[0];
  var reporting = race.eevp || race.reportingPercent;

  return sorted.map(function(c) {
    var className = ["candidate", c.party];
    if (reporting > .5 && c == leading) className.push("leading");
    if (c.winner == "X") className.push("winner");
    if (race.runoff) className.push("runoff");

    return (
      <td class={className.join(" ")}>
        <div class="perc">{Math.round(c.percent*100)}%</div>
      </td>
    );
  });
}

export default function ResultsBoardPresident(props) {
  console.log("props",props)

  return (
    <>
      <div class={"board-wrapper " + props.office}>
        <div class="board-inner">
          <h3 class="board-hed">{props.hed}</h3>
          <table class="president results table">
          	<tr>
              <th class="state-hed">State</th>
          		<th class="electoral-hed">E.V.</th>
              <th class="party-hed">Dem.</th>
          		<th class="party-hed">GOP</th>
              <th class="reporting-hed">% in</th>
              <th class="little-hed"></th>
          	</tr>

            {props.races.map(function(r, i) {
              var hasResult = r.eevp || r.reporting || r.called || r.runoff;
              var reporting = r.eevp || r.reportingPercent;
              var percentIn = reporting ? reportingPercentage(reporting) + "% in" : "";
              var winner = r.candidates.filter(c => c.winner == "X");
              var flipped = winner[0] && (r.previousParty !== winner[0].party);
              var stateDetail = states[r.state] || {};

              return (
                <tr class={(hasResult ? "closed" : "open") + " index-" + i}>

                  {/* State */}
                  <td class={"state " + (winner[0] ? ("winner " + winner[0].party) : "")}>
                    <a href={"#/states/" + r.state + "/" + r.office}>
                      {stateDetail.ap} {r.district && r.district !== "AL" ? r.district : ""}
                    </a>
                  </td>

                  {/* Electoral votes */}
                  <td class={"electoral " + (winner[0] ? ("winner " + winner[0].party) : "")}>{r.electoral}</td>

                  {/* Open */}
                  <td class="open-label" colspan="3">Last polls close at {stateDetail.closingTime} ET</td>
                  
                  {/* Candidates */}
                  {CandidateCells(r)}

                  {/* EEVP */}
                  <td class="reporting">{percentIn}</td>

                  {/* Runoff or Flip */}
                  <td class={"little-label " + (flipped ? winner[0].party : "")}>
                    <span class={r.runoff ? "runoff-label" : ""}>{r.runoff ? "R.O." : ""}</span>
                    <span class={flipped ? "flip-label" : ""}>{flipped ? "Flip" : ""}</span>
                  </td>
                </tr>
              );
          })}
          </table>
        </div>
      </div>
    </>
  )
}