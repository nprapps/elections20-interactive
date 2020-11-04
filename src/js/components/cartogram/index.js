import { h, Component, createRef, Fragment } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage, winnerIcon } from "../util.js";
import states from "states.sheet.json";
import $ from "../../lib/qsa";
import track from "../../lib/tracking";
import BoardKey from "../boardKey";

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
      <>
      <BoardKey race="president" simple="true"/>
      <div class="cartogram" role="img" aria-label="Cartogram of state results">
        <div ref={this.svgRef} onMove={this.onMove}></div>
        <div class="tooltip" ref={this.tooltip}></div>
      </div>
      </>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    this.paint(this.props);
    this.initLabels();

    var svg = this.svgRef.current.querySelector("svg");
    svg.addEventListener("mousemove", (e) => this.onMove(e));
    svg.addEventListener("click", (e) => this.onClick(e));
  }

  onClick(e) {
    var group = e.target.closest("svg > g");
    if (!group) return;
    var state = group.getAttribute("data-postal");
    if (state) {
      window.location.href = `#/states/${state}/P`;
      track("clicked-cartogram", state);
    }
  }

  onMove(e) {
    var svg = this.svgRef.current.querySelector("svg");
    var tooltip = this.tooltip.current;

    // hover styles
    var currentHover = $(".hover", svg);
    currentHover.forEach(g => g.classList.remove("hover"));

    tooltip.classList.remove("shown");
    var postalGroup = e.target.closest("[data-postal]");
    if (!postalGroup) {
      return;
    }
    var postal = postalGroup.getAttribute("data-postal");

    $(`[data-postal="${postal}"]`, svg).forEach(g => g.classList.add("hover"));

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

    var candidates = result.candidates.filter(c => c.percent);

    tooltip.innerHTML = `
      <h3>${result.stateName}${district ? districtDisplay : ""} <span>(${result.electoral})</span></h3>
      <div class="candidates">${candidates.map(c =>
        `<div class="row">
            <div class="party ${c.party}"></div>
            <div class="name">${c.last}</div> ${c.winner == "X" ? winnerIcon : ""}
            <div class="perc">${Math.round(c.percent * 1000) / 10}%</div>
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
        var x = bbox.x - 10;
        var y = bbox.y + labelBox.height;
      } else {
        var x = bbox.x + bbox.width / 2;
        var y = bbox.y + bbox.height / 2 + labelBox.height / 2 - 3;
      }

      // on desktop, add electoral votes 

      if (window.innerWidth > 650) {
        y -= labelBox.height / 2 - 2;
        var votes = states[stateName].electoral;
        var electoralLabel = document.createElementNS(svg.namespaceURI, "text");
        electoralLabel.textContent = votes;
        g.appendChild(electoralLabel);

        electoralLabel.setAttribute("x", x);
        electoralLabel.setAttribute("y", y + 10);
        electoralLabel.setAttribute("class", "votes");
      }

      label.setAttribute("x", x);
      label.setAttribute("y", y);
    });
  }

  paint(props) {
    var mapData = props.races;
    if (!this.svgRef.current) return;
    var svg = this.svgRef.current.querySelector("svg");
    if (!svg) return;

    mapData.forEach(function (r) {
      var eevp = r.eevp || r.reportingPercent;
      var district = r.district;
      var state = r.state + (district ? "-" + district : "");
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var groups = svg.querySelectorAll(`[data-postal="${state}"]`);
      if (!groups.length) return;

      groups.forEach(function(g) {

        g.classList.remove("early", "winner", "leader", "GOP", "Dem");

        if (eevp > 0) {
          g.classList.add("early");
        }
        if (eevp > 0.5) {
          g.classList.add("leader");
          g.classList.add(leader);
        }
        if (winner) {
          g.classList.add("winner");
          g.classList.add(winner);
        }

      });
    });
  }
}
