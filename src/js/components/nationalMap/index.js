import { h, Component, createRef, Fragment } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import states from "states.sheet.json";
import BoardKey from "../boardKey";

var northeastStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC"];



export default class NationalMap extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.svgRef = createRef();
    this.tooltip = createRef();
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var response = await fetch("./assets/_map-geo.svg");
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
      <div class="map">
        <div ref={this.svgRef} role="img" aria-label="National map of results"></div>
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
    var state = e.target.getAttribute("data-postal");
    if (state) {
      track("clicked-map", state);
      window.location.href = `#/states/${state}/P`;
    }
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
    if (!e.target.hasAttribute("data-postal")) {
      return;
    }

    var group = e.target.closest("svg > g");
    svg.appendChild(group);
    e.target.parentNode.classList.add("hover");

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

    var stateName = e.target.getAttribute("data-postal");
    var district = e.target.getAttribute("data-district");
    var districtDisplay = district == "AL" ? " At-Large" : " " + district;
    var results = this.props.races.filter((r) => r.state == stateName);
    var result;

    if (district) {
      result = results.filter((r) => (r.district == district))[0];
    } else {
      result = results[0];
    }

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
    var groups = svg.querySelectorAll("g");

    groups.forEach(function(g) {
      var stateOutline = g.querySelector("path");
      var stateLabel = g.querySelector("text");

      if (!stateOutline) return;

      // handle NE and ME labels
      if (!stateOutline.hasAttribute("data-postal")) {
        var thisBlock = g.querySelector("rect");
        var positionX = parseInt(thisBlock.getAttribute("x")) - 12 + "px";
        var positionY = parseInt(thisBlock.getAttribute("y")) + 11 + "px";
        stateLabel.setAttribute("x", positionX);
        stateLabel.setAttribute("y", positionY);
        return;
      }

      var stateName = stateOutline.getAttribute("data-postal");
      var offsetX = states[stateName].geo_offset_x;
      var offsetY = states[stateName].geo_offset_y;

      // handle Northeastern state labels
      if (northeastStates.indexOf(stateName) > -1) {
        g.classList.add("northeast");
        var rect = document.createElementNS(svg.namespaceURI, "rect");
        g.append(rect);
        rect.setAttribute("data-postal", stateName)
        rect.setAttribute("x", offsetX - 15);
        rect.setAttribute("y", offsetY - 9);
        rect.setAttribute("width", 10);
        rect.setAttribute("height", 10);

        stateLabel.setAttribute("x", offsetX);
        stateLabel.setAttribute("y", offsetY);
      } else {
        var bounds = stateOutline.getBBox();
        var labelBox = stateLabel.getBBox();

        var positionX = bounds.x + bounds.width / 2;
        stateLabel.setAttribute("x", positionX);

        var positionY = bounds.y + bounds.height / 2 + labelBox.height / 3 - 1;
        stateLabel.setAttribute("y", positionY);

        if (offsetX) {
          stateLabel.setAttribute("dx", offsetX);
        }
        if (offsetY) {
          stateLabel.setAttribute("dy", offsetY);
        }
      }

      // electoral vote labels
      var voteLabel = document.createElementNS(svg.namespaceURI, "text");
      voteLabel.classList.add("votes");
      voteLabel.innerHTML = states[stateName].electoral;

      voteLabel.setAttribute("x", parseInt(stateLabel.getAttribute("x")));
      voteLabel.setAttribute("y", parseInt(stateLabel.getAttribute("y")) + 11);
      voteLabel.setAttribute("dx", parseInt(stateLabel.getAttribute("dx") || 0));
      voteLabel.setAttribute("dy", parseInt(stateLabel.getAttribute("dy") || 0));
      g.append(voteLabel);

      if (offsetX && northeastStates.indexOf(stateName) <= -1) {
        voteLabel.setAttribute("dx", offsetX);
      }
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
      var state = r.state.toLowerCase() + (district ? "-" + district : "");
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var stateGroup = svg.querySelector(`.${state}`);
      if (!stateGroup) return;

      stateGroup.classList.remove("early", "winner", "leader", "GOP", "Dem");

      if (eevp > 0) {
        stateGroup.classList.add("early");
      }
      if (eevp > 0.5) {
        stateGroup.classList.add("leader");
        stateGroup.classList.add(leader);
      }
      if (winner) {
        stateGroup.classList.add("winner");
        stateGroup.classList.add(winner);
      }

      var stateOutline = stateGroup.querySelector("path");
      var stateLabel = stateGroup.querySelector("text");
    });
  }
}
