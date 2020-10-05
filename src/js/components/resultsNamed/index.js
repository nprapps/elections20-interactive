import { h, Fragment } from "preact";

import "./resultsNamed.less";

export default function(props) {
  console.log("PROPS", props);
  return (
    <table class="named results table">
      { props.race.candidates.map(c => (
        <tr>
          <td>{c.first} {c.last}</td>
        </tr>
      ))}
    </table>
  )
}