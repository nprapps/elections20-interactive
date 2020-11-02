import { h, Fragment } from "preact";

export default function BoardKey(props) {
	var full = !props.simple;
  var race = props.race;
	var hasParties = race !== "ballot";
  var hasPickup = race == "house" || race == "senate";
	var hasIncumbent = race == "house" || race == "senate" || race == "gov";
	var hasEEVP = race !== "house" && race !== "ballot";

  return <div class="board-key">
    {full && <h3>Key</h3>}
    <ul>
      {hasParties && <>
	      	<li class="dem">{full ? "Democrat" : "Biden"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
	      	<li class="gop">{full ? "Republican" : "Trump"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
	      	{full && <li class="ind">Independent / <span class="leading">Leading</span> <span class="winner">Winner</span></li>}
      </>}
      {full && hasParties && <li class="pickup"><span>FLIP</span> {hasPickup ? "Seat pickup" : "Change in winning party"} (party color)</li>}
      {full && hasParties && <li class="runoff"><span>R.O.</span> Going to a runoff election</li>}
      {full && !hasParties && <>
      	<li class="yes">Yes / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
      	<li class="no">No / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
      </>}
      {full && <li class="eevp"><span class="perc">76% in</span> {hasEEVP ? <span>Expected vote*</span> : "Precincts reporting"}</li>}
      {full && hasIncumbent && <li class="incumbent">● Incumbent</li>}
    </ul>
  </div>
}