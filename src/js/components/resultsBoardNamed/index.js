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
        <tr class={((r.eevp == 0 || r.reporting == 0) && !r.called && !r.runoff) ? "open" : ""}>

          {/* State */}
          <td class="state">{r.state}{r.seatNumber ? "-" + r.seatNumber : ""}</td>

          {/* EEVP */}
          <td class="reporting">{(r.eevp && (r.eevp > 0 || r.called || r.runoff)) ? (r.eevp + "% in") : (r.eevp && r.eevp == 0) ? "" : (r.reporting > 0 || r.called || r.runoff) ? ((r.reporting / r.precincts * 100) + "% in") : ""}</td>

          {/* Open */}
          <td class="open-label" colspan="2">Polls still open</td>

          {/* Candidates */}
          {r.candidates[0].leading = true}
          {r.candidates.slice(0,2).sort((a,b) => (sortValue(a.party) - sortValue(b.party))).map(c => (
            <td class={"candidate " + c.party + (r.eevp > 50 & c.leading ? " leading" : "") + (c.winner == "X" ? " winner" : "") + (r.runoff ? " runoff" : "")}>
              {c.last} {c.incumbent ? <span>●</span> : ""}
              <span class="perc">{Math.round(c.percent*100)}%</span>
            </td>
          ))}

          {/* Runoff */}
          <td class="runoff-label">{r.runoff ? "Runoff" : ""}</td>
        </tr>
      ))}
    </table>
  )
}