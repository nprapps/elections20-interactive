import { h, Fragment } from "preact";
import { reportingPercentage } from "../util";
import isEmbedded from "../../lib/embedded";
import states from "states.sheet.json";

var sortParty = function(p) {
  return p == "GOP" ? Infinity : p == "Dem" ? -Infinity : 0;
};

function CandidateCells(race, winner) {
  var sorted = race.candidates.slice(0, 2).sort((a, b) => sortParty(a.party) - sortParty(b.party));
  var leading = race.candidates[0];
  var reporting = race.eevp || race.reportingPercent;

  return sorted.map(function(c) {
    var className = ["candidate", c.party];
    if (reporting > .5 && c == leading) className.push("leading");
    if (c.winner == "X") className.push("winner");
    if (winner && !c.winner) className.push("loser");
    if (race.runoff) className.push("runoff");

    return (
      <td role="cell" key={c.id} class={className.join(" ")}>
        <div class="perc">{Math.round(c.percent*1000)/10}%</div>
      </td>
    );    
  });
}

export default function ResultsBoardPresident(props) {
  // console.log("props",props)

  var hasFlips = props.races.some(function(r) {
    var [ winner ] = r.candidates.filter(c => c.winner == "X");
    return winner && (r.previousParty !== winner.party);
  });

  var tables = [ props.races ];

  if (props.split) {
    var half = Math.ceil(props.races.length / 2);    
    var firstHalf = props.races.splice(0, half);
    var secondHalf = props.races.splice(-half);
    tables = [ firstHalf, secondHalf ];
  }

  var classNames = [
    "board-wrapper president",
    props.addClass,
    hasFlips ? "has-flips" : "no-flips"
  ];

  return (
    <>
      <div class={classNames.filter(c => c).join(" ")}>
        {props.hed ? <h3 class="board-hed">{props.hed}</h3> : ""}
        <div class="board-inner">
          {tables.map(function(races) {
            return (
              <table class="president results table" role="table">
              	<tr role="row">
                  <th role="columnheader" class="state-hed">State</th>
              		<th role="columnheader" class="electoral-hed">E.V.</th>
                  <th role="columnheader" class="party-hed">Biden</th>
              		<th role="columnheader" class="party-hed">Trump</th>
                  <th role="columnheader" class="reporting-hed">% in</th>
                  <th role="columnheader" class="little-hed"></th>
              	</tr>

                {races.map(function(r, i) {
                  var hasResult = r.eevp || r.reporting || r.called || r.runoff;
                  var reporting = "eevp" in r ? r.eevp : r.reportingPercent;
                  var percentIn = reporting || reporting == 0 
                    ? <span>{reportingPercentage(reporting)}%<span class="in"> in</span></span>
                    : "";
                  var [ winner ] = r.candidates.filter(c => c.winner == "X");
                  var flipped = winner && (r.previousParty !== winner.party);
                  var stateDetail = states[r.state] || {};

                  return (
                    <tr key={r.state+r.district} role="row" class={(hasResult ? "closed" : "open") + " index-" + i}>

                      {/* State */}
                      <td role="cell" class="state">
                        <a
                          href={"?#/states/" + r.state + "/" + r.office}
                          target="_top"
                        >
                          {stateDetail.ap} {r.district && r.district !== "AL" ? r.district : ""}
                        </a>
                      </td>

                      {/* Electoral votes */}
                      <td role="cell" class="electoral">{r.electoral}</td>

                      {/* Open */}
                      <td role="cell" class="open-label" colspan="3">Last polls close at {stateDetail.closingTime} ET</td>
                      
                      {/* Candidates */}
                      {CandidateCells(r, winner)}

                      {/* EEVP */}
                      <td role="cell" class="reporting">{percentIn}</td>

                      {/* Runoff or Flip */}
                      <td role="cell" class={"little-label " + (flipped ? winner.party : "")}>
                        <span class={r.runoff ? "runoff-label" : ""}>{r.runoff ? "R.O." : ""}</span>
                        <span class={flipped ? "flip-label" : ""}>{flipped ? "Flip" : ""}</span>
                      </td>
                    </tr>
                );
              })}
            </table>
          );
        })}
        </div>
      </div>
    </>
  )
}