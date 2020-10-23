import { h, Fragment, Component, createRef } from "preact";

// d3 is weird about imports, apparently
var d3 = require("d3-force/dist/d3-force.min.js");

var { sqrt, PI, cos, sin } = Math;

export default class ElectoralBubbles extends Component {

  constructor() {
    super();
    this.state = {
      nodes: []
    }
    this.svg = createRef();

    // window.addEventListener("resize", () => this.setState({ resize: window.innerWidth }));
  }

  positionBubbles(results) {
    var svg = this.svg.current;
    var svgBounds = svg.getBoundingClientRect();
    var { width, height } = svgBounds;
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    results = results.filter(r => r.called || r.eevp > .5);
    // create basic objects
    var nodes = results.map(function(r) {
      var [ winner, loser ] = r.candidates;
      var margin = winner.percent - loser.percent;
      var { winnerParty, electoral, state, district, called } = r;
      var key = district ? state + district : state;
      return {
        key,
        state,
        district,
        called,
        winnerParty: winner.party,
        electoral,
        margin
      }
    });

    nodes.sort((a, b) => b.electoral - a.electoral);

    // find the margin range
    var maxMargin = Math.max(...nodes.map(m => Math.abs(m.margin)));
    maxMargin = Math.round(maxMargin * 10) / 10;

    var centerX = width / 2;

    // set the normalized cx within that range
    for (var circle of nodes) {
      var offset = circle.margin / maxMargin * centerX;
      if (circle.winnerParty == "Dem") offset *= -1;
      circle.x = circle.cx = centerX + offset;
      circle.y = 0;
      circle.r = Math.max(height / 300 * circle.electoral, 10);
    }

    var simulation = d3.forceSimulation(nodes);
    var strength = .02;
    var decay = .2;

    var xForce = d3.forceX().x(d => d.cx).strength(strength * 10);
    var yForce = d3.forceY().strength(strength);
    var collider = d3.forceCollide();
    collider.radius(d => d.r + 2);

    simulation.velocityDecay(decay);
    simulation.force("x", xForce);
    simulation.force("y", yForce);
    simulation.force("collide", collider);

    // simulation.stop();
    // simulation.tick(200);
    simulation.on("tick", () => {
      for (var n of nodes) {
        n.cx = n.x;
        n.cy = height / 2 + n.y;
      }
      this.setState({ nodes });
    });

    this.simulation = simulation;

    this.setState({ nodes });
  }

  shouldComponentUpdate(props, state) {
    var { results } = props || this.props;
    if (this.props.results == results && this.state.resize == state.resize) return;
    if (!results) return;

    if (this.simulation) {
      this.simulation.stop();
    }

    // run the simulation
    var bubbles = this.positionBubbles(results);
  }

  render(props, state) {
    var { nodes } = state;
    return <div class="electoral-bubbles">
      <div class="aspect-ratio">
        <svg class="bubble-svg" ref={this.svg}
          preserveAspectRatio="none"
        >
          {nodes.map(n => (<>
            <circle
              data-key={n.key}
              key={n.key}
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              class={`${n.winnerParty} ${n.called ? "called" : "pending"}`}
            />
            {n.cy && n.cx && <text x={n.cx} y={n.cy + 5}>{n.state}</text>}
          </>))}
        </svg>
      </div>
    </div>
  }
}