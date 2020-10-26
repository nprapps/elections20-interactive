import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage, winnerIcon } from "../util.js";
import states from "states.sheet.json";

var northeastStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC"];

export default class Cartogram extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.svgRef = createRef();
    this.tooltip = createRef();
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var response = await fetch("./assets/_map-cartogram.svg");
    var text = await response.text();
    var svg = await this.loadSVG(text);
    this.setState({ svg: svg });
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  shouldComponentUpdate(props) {
    this.paint(props);
  }

  render() {
    return (
      <div class="map">
        <div ref={this.svgRef} onMove={this.onMove}></div>
        <div class="tooltip" ref={this.tooltip}></div>
      </div>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    this.paint(this.props);
    this.initLabels();

    var svg = this.svgRef.current.querySelector("svg");
    svg.addEventListener("mousemove", (e) => this.onMove(e));
  }

  onMove(e) {
    var svg = this.svgRef.current.querySelector("svg");
    var tooltip = this.tooltip.current;

    // hover styles
    var currentHover = svg.querySelector(".hover");
    if (currentHover) {
      currentHover.classList.remove("hover");
    }

    tooltip.classList.remove("shown");
    var postalGroup = e.target.closest("[data-postal]");
    if (!postalGroup) {
      return;
    }

    postalGroup.classList.add("hover");

    // tooltips
    var bounds = svg.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= 150;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    var postal = postalGroup.getAttribute("data-postal");
    var [ stateName, district ] = postal.split("-");
    var districtDisplay = district == "AL" ? " At-Large" : " " + district;
    var results = this.props.races.filter((r) => r.state == stateName);
    var result;

    if (district) {
      result = results.filter((r) => (r.district == district))[0];
    } else {
      result = results[0];
    }

    if (!result) return;

    tooltip.innerHTML = `
      <h3>${result.stateName}${district ? districtDisplay : ""} <span>(${result.electoral})</span></h3>
      <div class="candidates">${result.candidates.map(c =>
        `<div class="row">
            <div class="party ${c.party}"></div>
            <div class="name">${c.last}</div> ${c.winner == "X" ? winnerIcon : ""}
            <div class="perc">${c.percent ? Math.round(c.percent * 1000) / 10 : "0"}%</div>
        </div>`
      ).join("")}</div>
      <div class="reporting">${reportingPercentage(
        result.eevp || result.reportingPercent
      )}% in</div>
    `;

    tooltip.classList.add("shown");
  }

  initLabels() {
    var svg = this.svgRef.current.querySelector("svg");
    var groups = svg.querySelectorAll("svg > g[data-postal]");

    groups.forEach(function(g) {

      var stateName = g.dataset.postal;
      var square = g.querySelector("rect");
      var label = g.querySelector("text");
      var bbox = square.getBBox();
      var labelBox = label.getBBox();
      var hasDistricts = g.querySelector("[data-postal]");

      // handle NE and ME labels
      if (hasDistricts) {
        label.setAttribute("x", bbox.x - 10);
        label.setAttribute("y", bbox.y + labelBox.height);
      } else {
        label.setAttribute("x", bbox.x + bbox.width / 2);
        label.setAttribute("y", bbox.y + bbox.height / 2 + 3);
      }
    });
  }

  paint(props) {
    var mapData = props.races;
    if (!this.svgRef.current) return;
    var svg = this.svgRef.current.querySelector("svg");

    mapData.forEach(function (r) {
      var eevp = r.eevp || r.reportingPercent;
      var district = r.district;
      var state = r.state + (district ? "-" + district : "");
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var groups = svg.querySelectorAll(`[data-postal="${state}"]`);
      if (!groups.length) return;

      groups.forEach(function(g) {

        if (eevp > 0) {
          g.classList.add("early");
        }
        if (eevp > 0.5) {
          g.classList.add("leader");
          g.classList.add(leader);
        }
        if (winner) {
          g.classList.remove("leader");
          g.classList.remove(leader);
          g.classList.add("winner");
          g.classList.add(winner);
        }

      });
    });
  }
}
