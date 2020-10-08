import { h, Fragment } from "preact";
import { cssClass, reportingPercentage } from "../util";

import "../resultsBoardNamed/resultsBoard.less";

var sortParty = function(p) {
  return p == "GOP" ? Infinity : p == "Dem" ? -Infinity : 0;
};

function CandidateCells(race) {
  var sorted = race.candidates.slice(0, 3).sort((a, b) => sortParty(a.party) - sortParty(b.party));
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
      <div>
        <h3 class="board-hed">{props.hed}</h3>
        <table class="president results table">
        	<tr>
        		<th colspan="2" class="state-hed">State</th>
        		<th>Dem.</th>
        		<th>Rep.</th>
        		<th>Ind.</th>
        	</tr>

          {props.races.map(function(r) {
            var hasResult = r.eevp || r.reporting || r.called || r.runoff;
            var reporting = r.eevp || r.reportingPercent;
            var percentIn = reporting ? reportingPercentage(reporting) + "% in" : "";

            return (
              <tr class={hasResult ? "closed" : "open"}>

                {/* State */}
                <td class="state">{r.state}</td>

                {/* EEVP */}
                <td class="reporting">{percentIn}</td>

                {/* Open */}
                <td class="open-label" colspan="4">Last polls close at TK ET</td>

                {/* Candidates */}
                {CandidateCells(r)}

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