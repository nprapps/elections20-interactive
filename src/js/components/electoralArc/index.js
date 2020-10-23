import { h, Fragment, Component, createRef } from "preact";

var sum = list => list.reduce((t, r) => t + r.electoral, 0);
var { cos, sin, PI } = Math;

var unit = PI / 538;

export function Leaderboard(props) {
  var { called } = props;

  return (
    <div class="leaderboard">
      <div class="results-header-group dem">
        <h2 class="party">
          <label>Biden</label>
          <abbr>{sum(called.Dem)}</abbr>
        </h2>
      </div>

      <div class="results-header-group gop">
        <h2 class="party">
          <label>Trump</label>
          <abbr>{sum(called.GOP)}</abbr>
        </h2>
      </div>

      <div class="results-header-group not-called">
        <h2 class="party">
          <label>Uncalled</label>
          <abbr>{sum(called.uncalled)}</abbr>
        </h2>
      </div>
    </div>
  );
}

export default function ElectoralArc(props) {
  var { results, width = 1600, height = 900, depth = 10 } = props;

  var spokes = 538 / depth;
  var space = PI / spokes;

  var getSpoke = i => (i / depth) | 0;
  var getRing = i => i % depth;

  var getX = (theta, r) => cos(theta) * -r;
  var getY = (theta, r) => sin(theta) * -r;

  var called = {
    Dem: [],
    GOP: [],
    uncalled: []
  }

  if (results) {
    results.forEach(r => r.called && called[r.winnerParty || "uncalled"].push(r));
  }

  var start = PI * .05;
  var arc = PI * .9;

  var dots = {
    Dem: called.Dem.flatMap(r => new Array(r.electoral).fill(r.state)),
    GOP: called.GOP.flatMap(r => new Array(r.electoral).fill(r.state))
  }

  console.log(dots);

  return (<>
    <div class="electoral-arc">

      <Leaderboard called={called} />

      <div class="aspect-ratio">
        <svg class="arc" 
          width={width} height={height} preserveAspectRatio="none"
          viewBox={`0 0 ${width} ${height}`}
        >
          <g class="Dem">
            {dots.Dem.map((r, i) => {
              var spoke = getSpoke(i);
              var ring = getRing(i);

              var cx = 800 - cos(spoke / spokes * arc + start) * (500 + ring * 30);
              var cy = 850 - sin(spoke / spokes * arc + start) * (500 + ring * 30);
              return (<>
                <circle
                  class="Dem landslide"
                  r={13}
                  cx={cx}
                  cy={cy}
                />
                <text x={cx} y={cy + 5}>{r}</text>
              </>)
            })}
          </g>
          <g class="GOP">
            {dots.GOP.map((r, i) => {
              var spoke = getSpoke(539 - i);
              var ring = getRing(539 - i);

              var cx = 800 - cos(spoke / spokes * arc + start) * (500 + ring * 30);
              var cy = 850 - sin(spoke / spokes * arc + start) * (500 + ring * 30);
              return (<>
                <circle
                  class="GOP landslide"
                  r={12}
                  cx={cx}
                  cy={cy}
                />
                <text x={cx} y={cy + 5}>{r}</text>
              </>)
            })}
          </g>
        </svg>
      </div>

    </div>

  </>)
}

// export default class ElectoralArc extends Component {
//   constructor() {
//     super();
//     this.state = {
//       called: {
//         Dem: [],
//         GOP: [],
//         uncalled: []
//       },
//       wedges: {
//         Dem: [],
//         GOP: []
//       }
//     };
//     this.svg = createRef();
//   }

//   // call when props first come in
//   // create computed state
//   shouldComponentUpdate(props) {
//     var { results } = props;

//     var called = {
//       Dem: [],
//       GOP: [], 
//       uncalled: []
//     };

//     var wedges = {
//       Dem: [],
//       GOP: []
//     }

//     if (results) {
//       results.forEach(r => called[r.winnerParty || "uncalled"].push(r));

//       for (var k in wedges) {
//         var counter = 0;
//         wedges[k] = called[k]
//           .sort((a, b) => a.updated - b.updated)
//           .map(function(original) {
//             var { state, electoral } = original;
//             var [winner, loser] = original.candidates;
//             var margin = winner.percent - loser.percent;
//             var party = original.winnerParty;
//             var start = counter;
//             counter += electoral;
//             return {
//               state,
//               start,
//               electoral,
//               margin,
//               party,
//               original
//             };
//           });
//       }

//       this.setState({ called, wedges });
//     }
//   }

//   getPoint(cx, cy, theta, rx, ry) {
//     return [cx + cos(theta) * -rx, cy + sin(theta) * -ry];
//   }

//   wedgePath(cx, cy, rx, ry, start, end, thickness) {

//     var irx = rx - thickness;
//     var iry = ry - thickness;

//     var a = this.getPoint(cx, cy, start, rx, ry);
//     var b = this.getPoint(cx, cy, end, rx, ry);
//     var c = this.getPoint(cx, cy, end, irx, iry);
//     var d = this.getPoint(cx, cy, start, irx, iry);
//     var instructions = [
//       `M${a[0]} ${a[1]}`,
//       `A${rx} ${ry} 0 0 1 ${b[0]} ${b[1]}`,
//       `L${c[0]} ${c[1]}`,
//       `A${irx} ${iry} 0 0 0 ${d[0]} ${d[1]}`,
//       `Z`
//     ].join(" ");
//     return instructions;
//   }

//   // now draw the wedges after render()
//   componentDidUpdate() {
//     var svg = this.svg.current;
//     var { wedges } = this.state;
//     var NS = svg.namespaceURI;

//     // update SVG coordinate system
//     var bounds = svg.getBoundingClientRect();
//     svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);

//     var cx = bounds.width >> 1;
//     var cy = bounds.height;
//     var rx = (bounds.width - 60) >> 1;
//     var ry = (bounds.height - 30);

//     svg.querySelectorAll("path").forEach(p => p.remove());
//     wedges.Dem.forEach(w => {
//       var wedge = document.createElementNS(NS, "path");
//       wedge.setAttribute("d", this.wedgePath(
//         cx, cy, 
//         rx, ry, 
//         w.start * unit, (w.start + w.electoral) * unit, 200
//       ));
//       var marginClass = w.margin > .1 ? "landslide" :
//         w.margin > .05 ? "major" : "minor";
//       wedge.setAttribute("class", `${w.party} ${marginClass}`);
//       svg.appendChild(wedge);
//     });

//     wedges.GOP.forEach(w => {
//       var wedge = document.createElementNS(NS, "path");
//       wedge.setAttribute("d", this.wedgePath(
//         cx, cy, 
//         rx, ry, 
//         PI - (w.start + w.electoral) * unit , PI - w.start * unit, 200
//       ));
//       var marginClass = w.margin > .1 ? "landslide" :
//         w.margin > .05 ? "major" : "minor";
//       wedge.setAttribute("class", `${w.party} ${marginClass}`);
//       svg.appendChild(wedge);
//     })
//   }

//   render(props, state) {
//     var { called } = state;

//     return (<>
//       <div class="electoral-arc">

//         <Leaderboard called={called} />

//         <div class="aspect-ratio">
//           <svg class="arc" ref={this.svg} />
//         </div>

//       </div>

//     </>);
//   }
// }