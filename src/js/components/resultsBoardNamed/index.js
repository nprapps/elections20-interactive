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
          <td class="state">{r.state}</td>
          <td class="reporting">{r.eevp}% in</td>
          {r.candidates.slice(0,2).sort((a,b) => (sortValue(a.party) - sortValue(b.party))).map(c => (
            <td class={"candidate " + c.party}>
              {c.last} {c.incumbent ? <span>●</span> : ""}
              <span class="perc">{Math.round(c.percent*100)}%</span>
            </td>
          ))}
        </tr>
      ))}
    </table>
  )
}