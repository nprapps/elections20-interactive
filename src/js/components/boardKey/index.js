import { h } from "preact";

export default function BoardKey() {
  return <div class="board-key">
    <ul>
      <li class="dem">Democrat / <span class="leaning">Leaning</span> <span class="winner">Winner</span></li>
      <li class="gop">Republican / <span class="leaning">Leaning</span> <span class="winner">Winner</span></li>
      <li class="ind">Independent / <span class="leaning">Leaning</span> <span class="winner">Winner</span></li>
      <li class="incumbent">● Incumbent</li>
      <li class="pickup"><span>FLIP</span> TKTK Seat pickup (party color)</li>
      <li class="runoff"><span>R.O.</span> Going to a runoff election</li>
      <li class="yes">Yes / <span class="leaning">Leaning</span> <span class="winner">Winner</span></li>
      <li class="no">No / <span class="leaning">Leaning</span> <span class="winner">Winner</span></li>
      <li class="eevp"><span>76% in</span> TKTK Precincts reporting</li>
    </ul>
  </div>
}