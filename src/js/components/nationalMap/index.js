import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage } from "../util.js";
import "./nationalMap.less";
import states from "states.sheet.json";

var northeastStates = [ "VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC" ];

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
    svg.addEventListener("mousemove", e => this.onMove(e));
  }

  onMove(e) {
    var svg = this.svgRef.current.querySelector("svg");
    var tooltip = document.querySelector(".tooltip");

    // hover styles
    var currentHover = svg.querySelector(".hover");
    if (currentHover) { currentHover.classList.remove("hover") };

    if (!e.target.hasAttribute("data-postal")) {
      tooltip.classList.remove("shown");
      return;
    }

    var group = e.target.closest("svg > g");
    svg.appendChild(group);
    e.target.classList.add("hover");

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
    var result = this.props.races.filter(r => r.state == stateName)[0];
    console.log(result)

    // var candText = "";
    // if (result.reportingPercent > 0.5) {
    //   var leadingCandidate = result.candidates[0];
    //   var prefix = leadingCandidate.winner ? "Winner: " : "Leading: ";
    //   var candText = `${prefix}${leadingCandidate.last} (${
    //     leadingCandidate.percent
    //       ? reportingPercentage(leadingCandidate.percent)
    //       : 0
    //   }%)`;
    // }

    tooltip.innerHTML = `
      <h3>${result.stateName} <span>(${result.electoral})</span></h3>
      <div class="candidates">${result.candidates}</div>
      <div class="reporting">${reportingPercentage(result.reportingPercent)}% in</div>
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

      if (!stateOutline.hasAttribute("data-postal")) {
        // handle NE and ME

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

      if (northeastStates.indexOf(stateName) > -1) {
          // handle Northeastern states

          g.classList.add("northeast");

          var rect = document.createElementNS(svg.namespaceURI, "rect");
          g.append(rect);
          rect.setAttribute("x", offsetX - 15);
          rect.setAttribute("y", offsetY - 9);
          rect.setAttribute("width", 10);
          rect.setAttribute("height", 10);

          stateLabel.setAttribute("x", offsetX);
          stateLabel.setAttribute("y", offsetY);

      } else {
        var bounds = stateOutline.getBBox();
        var labelBox = stateLabel.getBBox();

        var positionX = (bounds.x + (bounds.width / 2));
        stateLabel.setAttribute("x", positionX);

        var positionY = (bounds.y + (bounds.height / 2) + (labelBox.height / 3)) - 1;
        stateLabel.setAttribute("y", positionY)

        if (offsetX) { stateLabel.setAttribute("dx", offsetX); }
        if (offsetY) { stateLabel.setAttribute("dy", offsetY); }
      }
    });
  }

  paint(props) {
    var mapData = props.races;
    if (!this.svgRef.current) return;
    var svg = this.svgRef.current.querySelector("svg");

    mapData.forEach(function(r) {
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
      

    })
  }
}
