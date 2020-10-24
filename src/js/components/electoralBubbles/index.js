import { h, Fragment, Component, createRef } from "preact";

// d3 is weird about imports, apparently
var d3 = require("d3-force/dist/d3-force.min.js");

var { sqrt, PI, cos, sin } = Math;

const Y_FORCE = .01;
const X_FORCE = .2;
const COLLIDE_FORCE = 1;
const VISUAL_DOMAIN = .5;
const DATA_DOMAIN = .3;
const POLAR_OFFSET = .05;
const TEXT_SIZE = 12;
const MIN_RADIUS = 12;
const FROZEN = .001;

var nextTick = function(f) {
  requestAnimationFrame(f);
}

export default class ElectoralBubbles extends Component {

  constructor() {
    super();
    this.state = {
      nodes: [],
      width: 1600,
      height: 900
    };
    this.svg = createRef();

    this.collisionRadius = this.collisionRadius.bind(this);
    this.intersect = this.intersect.bind(this);
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    this.xAccess = this.xAccess.bind(this);

    var simulation = d3.forceSimulation();
    simulation.stop(); // only run when visible

    var xForce = d3.forceX().x(this.xAccess).strength(X_FORCE);
    var yForce = d3.forceY().strength(Y_FORCE);
    var collider = d3.forceCollide().strength(COLLIDE_FORCE);
    collider.radius(this.collisionRadius);

    simulation.force("x", xForce);
    simulation.force("y", yForce);
    simulation.force("collide", collider);

    this.simulation = simulation;

    this.observer = new IntersectionObserver(this.intersect);
    this.running = false;

    window.addEventListener("resize", this.resize);
  }

  xAccess(d) {
    var centerX = this.state.width / 2;
    var { mx, margin, party } = d;
    var offset = party == "Dem" ? -POLAR_OFFSET : POLAR_OFFSET;
    var pole = centerX + (centerX * offset);
    var x = mx * centerX + pole;
    return x;
  }

  nodeRadius(d) {
    return Math.max(d.electoral * (this.state.height / 400), MIN_RADIUS);
  }

  collisionRadius(d) {
    return this.nodeRadius(d) + 4;
  }

  resize() {
    var bounds = this.svg.current.getBoundingClientRect();
    var { width, height } = bounds;
    this.setState({ width, height });
    this.simulation.alpha(1);
  }

  intersect([e]) {
    if (e.isIntersecting) {
      if (!this.running) {
        console.log("Starting force sim...");
        this.running = true;
        this.simulation.alpha(1);
        requestAnimationFrame(this.tick);
      }
    } else {
      console.log("Pausing force sim...");
      this.running = false;
    }
  }

  tick(t) {
    if (!this.running) return 
    // schedule updates
    nextTick(this.tick);

    var svg = this.svg.current;
    var bounds = svg.getBoundingClientRect();
    var { width, height } = bounds;
    if (!width || !height) return;
    if (width != this.state.width && height != this.state.height) {

      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    }

    var { nodes } = this.state;

    // update node state, like radius if newly added

    // run the simulation against the nodes
    var alpha = this.simulation.alpha();
    if (alpha > FROZEN) {
      this.simulation.nodes(nodes);
      this.simulation.tick();

      // render with new positions
      this.setState({ nodes, width, height });
    }

  }

  createNode(r) {
    var [ winner, loser ] = r.candidates;
    var margin = winner.percent - loser.percent;
    var party = winner.party;
    // normalize margin
    var mx = Math.min(margin, DATA_DOMAIN) / VISUAL_DOMAIN;
    if (party == "Dem") mx *= -1;
    var x = mx;
    var { state, district, called, electoral } = r;
    var key = r.district ? r.state + r.district : r.state;
    return {
      key,
      state,
      district,
      called,
      electoral,
      margin,
      mx,
      party
    };
  }

  updateNodes(results) {
    var { nodes } = this.state;

    var touched = new Set();

    results = results.filter(r => r.called || r.eevp > .5);
    for (var r of results) {
      // find an existing node?
      var upsert = this.createNode(r);
      var existing = nodes.find(n => n.key == upsert.key);
      if (existing) {
        Object.assign(existing, upsert);
        touched.add(existing);
      } else {
        // add the node
        upsert.x = this.xAccess(upsert);
        upsert.y = 0;
        nodes.push(upsert);
        touched.add(upsert);
      }
    }

    // remove missing results
    nodes = nodes.filter(n => touched.has(n));

    this.simulation.alpha(1);

    this.setState({ nodes });
  }

  shouldComponentUpdate(props, state) {
    var { results = [] } = props || this.props;
    if (props.results != this.props.results) this.updateNodes(results);
  }

  componentDidMount() {
    this.resize();
    this.observer.observe(this.base);
  }

  componentWillUnmount() {
    this.observer.disconnect();
  }

  render(props, state) {
    var { nodes, width, height } = state;
    var [ n ] = nodes;
    return <div class="electoral-bubbles">
      <div class="aspect-ratio">
        <svg class="bubble-svg" ref={this.svg}
          role="img"
          aria-label="Bubble plot of state margins"
          preserveAspectRatio="none"
          width={width} height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {nodes.map(n => (<>
            <circle
              data-key={n.key}
              key={n.key}
              cx={n.x}
              cy={n.y + height / 2}
              r={this.nodeRadius(n)}
              class={`${n.party} ${n.called ? "called" : "pending"}`}
            />
            <text 
              x={n.x} 
              y={n.y + (height / 2) + (TEXT_SIZE / 2) - 2}
              font-size={TEXT_SIZE + "px"}>{n.state}</text>
          </>))}
        </svg>
      </div>
    </div>
  }
}