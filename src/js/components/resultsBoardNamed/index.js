import { h, Fragment } from "preact";
import { reportingPercentage, sortByParty } from "../util";
import states from "states.sheet.json";

function CandidateCells(race, winner) {
  var sorted = race.candidates.slice(0, 2).sort(sortByParty);
  var leading = race.candidates[0];
  var reporting = "eevp" in race ? race.eevp : race.reportingPercent;

  return sorted.map(function(c) {
    var className = ["candidate", c.party];
    if (reporting > .5 && c == leading) className.push("leading");
    if (c.winner == "X") className.push("winner");
    if (winner && !c.winner) className.push("loser");
    if (race.runoff) className.push("runoff");

    return (
      <td role="cell" class={className.join(" ")}>
        <div class="name">
          <div class="last">{c.last}</div>
          <div class="incumbent">{c.incumbent ? "●" : ""}</div>
        </div>
        <div class="perc">{Math.round(c.percent*100)}%</div> 
      </td>
    );
  });
}

export default function ResultsBoardNamed(props) {
  // console.log("props",props)

  var hasFlips = props.races.some(function(r) {
    var [ winner ] = r.candidates.filter(c => c.winner);
    return winner && (
      // seat flipped
      r.previousParty !== winner.party ||
      // runoff
      winner.winner == "R"
    );
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
    props.office,
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
              <table class="named results table" role="table">
      {/*          <tr>
                  <th class="state-hed">State</th>
                  <th colspan="2" class="name-hed">Top candidates</th>
                  <th class="reporting-hed">% in</th>
                  <th></th>
                </tr>*/}

                {races.map(function(r,i) {
                  var hasResult = r.eevp || r.reporting || r.called || r.runoff;
                  var reporting = r.eevp || r.reportingPercent;
                  var percentIn = reporting || reporting == 0 
                    ? <span>{reportingPercentage(reporting)}%<span class="in"> in</span></span>
                    : "";
                  var [ winner ] = r.candidates.filter(c => c.winner == "X");
                  var [ incumbent ] = r.candidates.filter(c => c.incumbent);
                  var flipped = winner && (r.previousParty !== winner.party);
                  var seatLabel = "";
                  var ballotLabel = "";
                  switch (r.office) {
                    case "H": seatLabel = ` ${r.seatNumber}`;
                    case "S":
                      if (r.seatNumber) {
                        seatLabel = ` ${r.seatNumber}`;
                      }
                      break;

                    case "I":
                      ballotLabel = ` ${r.seat}`;
                      break;
                  }

                  return (
                    <tr key={r.id} class={"tr " + (hasResult ? "closed" : "open") + " index-" + i} role="row">

                      {/* State */}
                      <td class="state" role="cell">
                        <a target="_top" href={"?#/states/" + r.state + "/" + r.office}>
                          <span class="not-small">
                            {states[r.state].ap + seatLabel + ballotLabel}
                          </span>
                          <span class="x-small">
                            {r.state + seatLabel + ballotLabel}
                          </span>
                        </a>
                      </td>

                      {/* Open */}
                      <td class="open-label" colspan="3" role="cell">Last polls close at {states[r.state].closingTime} ET</td>
                      
                      {/* Candidates */}
                      {CandidateCells(r, winner)}

                      {/* EEVP */}
                      <td class={"reporting"} role="cell">{percentIn}</td>

                      {/* Runoff or Flip */}
                      {props.office !== "Ballot" && <>
                        <td class={"little-label " + (flipped ? winner.party : "")} role="cell">
                          <span class={r.runoff ? "runoff-label" : ""}>{r.runoff ? "R.O." : ""}</span>
                          <span class={flipped ? "flip-label" : ""}>{flipped ? "Flip" : ""}</span>
                        </td>
                      </>}
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