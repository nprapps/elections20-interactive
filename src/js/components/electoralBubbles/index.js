import { h, Fragment, Component, createRef } from "preact";
import { reportingPercentage, winnerIcon, groupCalled } from "../util";
import track from "../../lib/tracking";
import stateSheet from "states.sheet.json";
import BoardKey from "../boardKey";

// d3 is weird about imports, apparently
var d3 = require("d3-force/dist/d3-force.min.js");

var { sqrt, PI, cos, sin } = Math;

const Y_FORCE = .03;
const X_FORCE = .4;
const COLLIDE_FORCE = 1;
const MIN_DOMAIN = .1;
const MAX_DOMAIN = .3;
const POLAR_OFFSET = .02;
const HIDE_TEXT = 7;
const MIN_TEXT = 12;
const MIN_RADIUS = 3;
const FROZEN = .001;
const HEIGHT_STEP = 70;

var nextTick = function(f) {
  requestAnimationFrame(f);
}

var clamp = (v, l, h) => Math.min(Math.max(v, l), h);

export default class ElectoralBubbles extends Component {

  constructor(props) {
    super();
    this.state = {
      nodes: [],
      lookup: {},
      width: 1600,
      height: 900
    };
    this.svg = createRef();
    this.tooltip = createRef();
    this.lastHover = null;

    this.collisionRadius = this.collisionRadius.bind(this);
    this.intersect = this.intersect.bind(this);
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    this.xAccess = this.xAccess.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onExit = this.onExit.bind(this);

    var simulation = d3.forceSimulation();
    simulation.alphaDecay(0.04);
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
    var { mx, margin, alignment } = d;
    // generate log position
    var offset = alignment == "Dem" ? -POLAR_OFFSET : POLAR_OFFSET;
    var pole = centerX + (centerX * offset);
    var x = mx * centerX + pole;
    return x;
  }

  nodeRadius(d) {
    var a = d.electoral;
    var r = Math.sqrt(a / PI);
    return Math.max(r * (this.state.width / 60), MIN_RADIUS);
  }

  collisionRadius(d) {
    return this.nodeRadius(d) + 1;
  }

  resize() {
    var svg = this.svg.current;
    if (!svg) return;
    var bounds = svg.getBoundingClientRect();
    var { width, height } = bounds;
    if (width != this.state.width) {
      this.simulation.alpha(1);
    }
    this.setState({ width });
  }

  intersect([e]) {
    if (e.isIntersecting) {
      if (!this.running) {
        var svg = this.svg.current;
        if (svg) {
          var bounds = svg.getBoundingClientRect();
          var { width } = bounds;
          this.setState({ width });
        }
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
    if (!this.running) return;
    // schedule updates
    nextTick(this.tick);

    var svg = this.svg.current;
    if (!svg) return;
    var bounds = svg.getBoundingClientRect();
    var { width } = bounds;
    if (!width) return;
    if (width != this.state.width) {
      this.setState({ width });
    }

    var { nodes } = this.state;

    // update node state, like radius if newly added

    // run the simulation against the nodes
    var alpha = this.simulation.alpha();
    if (alpha > FROZEN) {
      this.simulation.nodes(nodes);
      this.simulation.tick();

      // render with new positions
      this.setState({ nodes });
    }

  }

  createNode(r, dataDomain) {
    var [ winner, loser ] = r.candidates;
    var margin = winner.percent - loser.percent;
    var party = r.winnerParty || winner.party;
    var alignment = winner.party;
    // normalize margin
    var mx = Math.log(Math.min(margin, MAX_DOMAIN) / dataDomain + 1);
    if (alignment == "Dem") mx *= -1;
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
      party,
      alignment,
      original: r
    };
  }

  updateNodes(results) {
    var { nodes } = this.state;

    var touched = new Set();
    var lookup = {};
    results.forEach(r => lookup[r.state + (r.district || "")] = r);

    var called = results.filter(r => r.called || r.eevp > .5);

    var dataDomain = Math.max(...called.map(function(r) {
      var [ winner, loser ] = r.candidates;
      return Math.abs(winner.percent - loser.percent);
    }));
    dataDomain = clamp(Math.ceil(dataDomain * 10) / 10, MIN_DOMAIN, MAX_DOMAIN);

    var maxRadius = this.nodeRadius({ electoral: 55 });

    for (var r of called) {
      // find an existing node?
      var upsert = this.createNode(r, dataDomain);
      var existing = nodes.find(n => n.key == upsert.key);
      if (existing) {
        upsert = Object.assign(existing, upsert);
        touched.add(upsert);
      } else {
        // add the node
        upsert.x = this.xAccess(upsert);
        upsert.y = (maxRadius - this.nodeRadius(r)) * (Math.random() > .5 ? 2 : -2);
        nodes.push(upsert);
        touched.add(upsert);
      }
      lookup[upsert.key] = r;
    }

    // remove missing results
    nodes = nodes.filter(n => touched.has(n));

    this.simulation.alpha(1);

    this.setState({ nodes, lookup });
  }

  shouldComponentUpdate(props, state) {
    var { results = [] } = props || this.props;
    if (props.results != this.props.results) this.updateNodes(results);
  }

  componentDidMount() {
    this.resize();
    this.observer.observe(this.base);
    if (this.props.results) this.updateNodes(this.props.results);
  }

  componentWillUnmount() {
    this.observer.disconnect();
  }

  goToState(state) {
    track("clicked-bubble", state);
    window.location.href = `#/states/${state}/P`;
  }

  onMove(e) {
    var bounds = this.base.getBoundingClientRect();
    var offsetX = e.clientX - bounds.left;
    var offsetY = e.clientY - bounds.top;
    var tooltip = this.tooltip.current;

    var key = e.target.dataset.key;
    var data = this.state.lookup[key];
    if (!key || !data) {
      return tooltip.classList.remove("show");
    }

    tooltip.classList.add("show");

    if (this.lastHover != key) {
      var stateName = stateSheet[data.state].name;
      var districtDisplay = data.district == "AL" ? "At-Large" : data.district;
      var h3 = data.district ? `${stateName} ${districtDisplay}` : stateName;
      var candidates = data.candidates.filter(c => c.percent);

      tooltip.innerHTML = `
        <h3>${h3} (${data.electoral})</h3>
        <div class="candidates">${candidates.map(c =>
          `<div class="row">
              <div class="party ${c.party}"></div>
              <div class="name">${c.last}</div> ${c.winner == "X" ? winnerIcon : ""}
              <div class="perc">${Math.round(c.percent * 1000) / 10}%</div>
          </div>`
        ).join("")}</div>
        <div class="reporting">${reportingPercentage(
          data.eevp || data.reportingPercent
        )}% in</div>
      `;
      this.lastHover = key;
    }

    var left = offsetX < bounds.width / 2 ? offsetX + 10 : offsetX - 4 - tooltip.offsetWidth;

    tooltip.style.left = left + "px";
    tooltip.style.top = offsetY + 10 + "px";
  }

  onExit(e) {
    this.tooltip.current.classList.remove("show");
  }

  render(props, state) {
    var { buckets } = props;
    var { nodes, width } = state;

    var distance = 0;
    nodes.forEach(n => {
      n.r = this.nodeRadius(n);
      var outerBounds = Math.abs(n.y) + n.r;
      if (outerBounds > distance) {
        distance = outerBounds;
      }
    });

    var yBounds = Math.ceil(distance / HEIGHT_STEP) * HEIGHT_STEP;
    if (yBounds - distance < 30) yBounds += 30;
    var height = yBounds * 2;
    var offset = 30;
    // create spacer for labels if they start to crowd the top
    // var offset = (height - distance * 2) < 30 ? 30 : 0;

    var uncalled = {};
    for (var k in props.buckets) {
      uncalled[k] = props.buckets[k].filter(r => !r.called && (r.eevp || 0) <= .5);
    }

    var hasUncalled = [...uncalled.likelyD, ...uncalled.tossup, ...uncalled.likelyR].length;

    var titles = {
      likelyD: "Likely Democratic",
      tossup: "Competitive states",
      likelyR: "Likely Republican"
    };

    return (
      <>
      <div class="electoral-bubbles" onMousemove={this.onMove} onMouseleave={this.onExit}>
      {nodes.length > 0 && <>
        <BoardKey race="president" simple="true"/>
        <div class="aspect-ratio">
          <svg class="bubble-svg" ref={this.svg}
            role="img"
            aria-label="Bubble plot of state margins"
            preserveAspectRatio="none"
            width={width} height={height + offset}
            viewBox={`0 0 ${width} ${height + offset}`}
          >
            <text class="leading-cue dem desktop" x={width / 2 - 40} y="20">
              &lt; Stronger Biden Lead
            </text>
            <text class="leading-cue dem mobile" x={width / 2 - 40} y="20">
              Stronger
            </text>
            <text class="leading-cue dem mobile" x={width / 2 - 40} y="35">
              &lt; Biden Lead
            </text>
            <text class="tied" x={width / 2} y="20">
              Tied
            </text>
            <text class="leading-cue gop desktop" x={width / 2 + 40} y="20">
              Stronger Trump lead &gt;
            </text>
            <text class="leading-cue gop mobile" x={width / 2 + 40} y="20">
              Stronger
            </text>
            <text class="leading-cue gop mobile" x={width / 2 + 40} y="35">
               Trump lead &gt;
            </text>
            <line class="separator" x1={width / 2} x2={width / 2} y1="25" y2={height - 10 + offset} />
            <g class="force-sim">
            {nodes.map(n => {
              var textSize = this.nodeRadius(n) * .5;
              return (<>
                <circle
                  class={`${n.party} ${n.called ? "called" : "pending"}`}
                  vector-effect="non-scaling-stroke"
                  data-key={n.key}
                  key={n.key}
                  cx={n.x}
                  cy={(n.y || 0) + height / 2 + offset}
                  r={n.r}
                  onClick={() => this.goToState(n.state)}
                />
                {textSize > HIDE_TEXT && <text 
                  class={`${n.party} ${n.called ? "called" : "pending"}`}
                  x={n.x} 
                  y={n.y + (height / 2) + (textSize * .4) + offset}
                  font-size={Math.max(textSize, MIN_TEXT) + "px"}>{n.state}</text>}
              </>);
            })}
            </g>
          </svg>
        </div>
      </>}
      <p class="disclaimer">
        To appear in this chart, a state must have either a declared winner or more than 50% of the estimated vote tabulated. States will be added as results come in. Early returns may not initially match up with the race call. So you may see a state called for one candidate but, for a time, appear in the other candidate's side of the chart. <a href="https://www.npr.org/2020/10/29/928863973/heres-how-npr-reports-election-results">How NPR Makes Calls</a>
      </p>
      {hasUncalled > 0 && <div class="uncalled">
        <h3>Early or no results yet:</h3>
        <div class="triplets">
          {["likelyD", "tossup", "likelyR"].map(rating => (
            !uncalled[rating].length ? "" : <div class="uncalled">
              <h4>{titles[rating]}</h4>
              <ul class="circles">
                {uncalled[rating].sort((a, b) => b.electoral - a.electoral).map(result => {
                  var reporting = result.eevp || result.reportingPercent;
                  var r = Math.max(this.nodeRadius(result), MIN_RADIUS);
                  var size = r * .5;
                  return <li>
                    <svg width={r * 2} height={r * 2}
                      class="uncalled-race"
                      role="img"
                      aria-label={result.stateName}
                      alt={result.stateName}
                    >
                      <circle
                        role="presentation"
                        class={"uncalled-race " + `${reporting ? "early" : "open"}`}
                        cx={r} cy={r} r={r - 1}
                        data-key={result.district ? result.state + result.district : result.state}
                        onClick={() => this.goToState(result.state)}
                      />
                      {size > HIDE_TEXT && (
                        <text
                          x={r} y={r + size * .4} 
                          font-size={Math.max(MIN_TEXT, size) + "px"}
                          class={"uncalled-race " + `${reporting ? "early" : "open"}`}
                        >
                          {result.state}
                        </text>
                      )}
                    </svg>
                  </li>
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>}
      <div class="tooltip" ref={this.tooltip}></div>
    </div>
    </>)
  }
}