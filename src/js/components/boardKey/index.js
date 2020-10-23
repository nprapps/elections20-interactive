import { h, Fragment } from "preact";

export default function BoardKey(props) {
	var race = props.race;
	var hasParties = race !== "ballot";
	var hasYesNo = race == "ballot";
	var hasIncumbent = race == "house" || race == "senate" || race == "gov";
	var hasEEVP = race !== "house";

  return <div class="board-key">
    <ul>
      {hasParties && <>
	      	<li class="dem">Democrat / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
	      	<li class="gop">Republican / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
	      	<li class="ind">Independent / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
      </>}
      {hasParties && <li class="pickup"><span>FLIP</span> TKTK Seat pickup (party color)</li>}
      {hasParties && <li class="runoff"><span>R.O.</span> Going to a runoff election</li>}
      {hasYesNo && <>
      	<li class="yes">Yes / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
      	<li class="no">No / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
      </>}
      <li class="eevp"><span>76% in</span> {hasEEVP ? "TKTK EEVP" : "TKTK Precincts reporting"}</li>
      {hasIncumbent && <li class="incumbent">● Incumbent</li>}
    </ul>
  </div>
}