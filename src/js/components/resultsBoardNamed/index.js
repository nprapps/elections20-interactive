import { h, Fragment } from "preact";

import "./resultsBoardNamed.less";

export default function(props) {
  console.log("props",props)

  var sortValue = function(p) {
    return p == "GOP" ? Infinity : p == "Dem" ? -Infinity : 0;
  } 

  return (
    <table class="named results table">
      {props.races.map(r => (
        <tr>
          <td class="state">{r.state}{r.seatNumber ? "-" + r.seatNumber : ""}</td>
          <td class="reporting">{r.eevp ? (r.eevp + "% in"): (r.reporting && r.precincts) ? (((r.reporting / r.precincts)*100) + "% in") : ""}</td>
          {r.candidates[0].leading = true}
          {r.candidates.slice(0,2).sort((a,b) => (sortValue(a.party) - sortValue(b.party))).map(c => (
            <td class={"candidate " + c.party + (r.eevp > 50 & c.leading ? " leading" : "") + (c.winner == "X" ? " winner" : "") + (r.runoff ? " runoff" : "")}>
              {c.last} {c.incumbent ? <span>●</span> : ""}
              <span class="perc">{Math.round(c.percent*100)}%</span>
            </td>
          ))}
          <td class="runoff-label">{r.runoff ? "RUNOFF" : ""}</td>
        </tr>
      ))}
    </table>
  )
}