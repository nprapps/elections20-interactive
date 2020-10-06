import { h, Fragment } from "preact";

import "./resultsBoardNamed.less";

export default function(props) {
  console.log("props",props)

  return (
    <table class="named results table">
      {props.races.map(r => (
        <tr>
          <td class="state">{r.state}</td>
          <td class="reporting">TK% in</td>
          {r.candidates.slice(0,2).map(c => (
            <td class={"candidate " + c.party}>{c.last} <span class="perc">{c.percent}%</span></td>
          ))}
        </tr>
      ))}
    </table>
  )
}