import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage } from "../util.js";
// import "./nationalMap.less";
import states from "states.sheet.json";

var northeastStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC"];

var winnerIcon =
  `<span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>`;

export default class NationalMap extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.svgRef = createRef();
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
      <div class="map">
        <div ref={this.svgRef}></div>
        <div class="tooltip"></div>
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
    var tooltip = document.querySelector(".tooltip");

    // hover styles
    var currentHover = svg.querySelector(".hover");
    if (currentHover) {
      currentHover.classList.remove("hover");
    }

    if (!e.target.hasAttribute("data-postal")) {
      tooltip.classList.remove("shown");
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
      x -= tooltip.offsetWidth + 10;
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
        result.eevp
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

    mapData.forEach(function (r) {
      var eevp = r.eevp;
      var district = r.district;
      var state = r.state.toLowerCase() + (district ? "-" + district : "");
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var stateGroup = svg.querySelector(`.${state}`);
      if (!stateGroup) return;

      if (eevp > 0.5) {
        stateGroup.classList.add("leader");
        stateGroup.classList.add(leader);
      }
      if (winner) {
        stateGroup.classList.remove("leader");
        stateGroup.classList.remove(leader);
        stateGroup.classList.add("winner");
        stateGroup.classList.add(winner);
      }

      var stateOutline = stateGroup.querySelector("path");
      var stateLabel = stateGroup.querySelector("text");
    });
  }
}
