import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { formatters, reportingPercentage, getParty } from "../util.js";

var specialStates = new Set(["IA", "MA", "OK", "WA"]);

export default class CountyMap extends Component {
  constructor(props) {
    super();

    this.fipsLookup = [];

    this.state = {};
    this.svgRef = createRef();
    this.containerRef = createRef();
    this.mapContainerRef = createRef();
    this.tooltipRef = createRef();
    this.guid = 0;

    var partyMap = {};
    props.sortOrder.forEach(function (c) {
      if (!partyMap[c.party]) {
        partyMap[c.party] = [];
      }
      partyMap[c.party].push(c.last);
    });
    this.partyMap = partyMap;
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var response = await fetch(
      "./assets/counties/" + this.props.state + ".svg"
    );
    var text = await response.text();
    var svg = await this.loadSVG(text);
    this.setState({ svg: svg });
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  componentDidUpdate() {
    this.paint();
  }

  render() {
    // Handle case where leading 2 candidates are of same party
    return (
      <div class="county-map" data-as="map" aria-hidden="true">
        <div ref={this.containerRef} class="container" data-as="container">
          <svg
            class="patterns"
            style="opacity: 0; position: absolute; left: -1000px">
            <pattern
              id="pending-0"
              class="stripes"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-45)">
              <path
                d="M5,0L5,10"
                stroke="rgba(0, 0, 0, .2)"
                stroke-width="4"></path>
            </pattern>
          </svg>
          <div class="key" data-as="key">
            <div class="key-grid">
              {this.props.sortOrder.map(candidate =>
                this.createLegend(candidate)
              )}
            </div>
          </div>
          <div
            ref={this.mapContainerRef}
            class="map-container"
            data-as="mapContainer">
            <div class="map" data-as="map">
              <div ref={this.svgRef}></div>
            </div>
            <div class="tooltip" ref={this.tooltipRef}></div>
          </div>
        </div>
      </div>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    var svg = this.svgRef.current.getElementsByTagName("svg")[0];

    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    var paths = svg.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });

    svg.addEventListener("click", e => this.onClick(e));
    svg.addEventListener("mousemove", e => this.onMove(e));
    svg.addEventListener("mouseleave", e => this.onMove(e));

    this.svg = svg;

    this.paint();

    this.updateDimensions();

    return svg;
  }

  updateDimensions() {
    var width = this.svg.getAttribute("width") * 1;
    var height = this.svg.getAttribute("height") * 1;

    // TODO: fix this
    var embedded = false; //document.body.classList.contains("embedded");
    var mapContainer = this.mapContainerRef.current;

    var w;
    var h;
    if (width > height * 1.4) {
      var ratio = height / (width * 2);
      w = Math.max(800, window.innerWidth);
      var h = w * ratio;
    } else if (width > height * 1.2) {
      var ratio = height / (width * 3);
      w = Math.max(800, window.innerWidth);
      var h = w * ratio;
    } else {
      var ratio = width / height;
      var w = 450;
      var h = w * ratio;
    }

    this.svg.setAttribute("width", w + "px");
    this.svg.setAttribute("height", h + "px");

    this.containerRef.current.classList.toggle("horizontal", width < height);
  }

  paint() {
    var mapData = this.props.data;
    if (!this.svg) return;

    var incomplete = false;

    for (var d of Object.keys(mapData)) {
      var [top] = mapData[d].candidates.sort((a, b) => b.percent - a.percent);
      this.fipsLookup[mapData[d].fips] = mapData[d];
    }

    var lookup = {};
    for (var d of Object.keys(mapData)) {
      var fips = mapData[d].fips;
      var candidates = mapData[d].candidates;
      var [top] = candidates.sort((a, b) => b.percent - a.percent);
      if (!top.votes) continue;

      var path = this.svg.querySelector(`[id="fips-${fips}"]`);
      if (!path) continue;
      path.classList.add("painted");

      var hitThreshold = mapData[d].reportingPercent > 0.5;
      var allReporting = mapData[d].reportingPercent >= 1;

      var topCand = this.partyMap[top.party];
      var specialShading =
        topCand && topCand.length > 1 ? topCand.indexOf(top.last) : "";
      path.classList.add(`i${specialShading}`);

      if (!hitThreshold) {
        path.style.fill = `url(#pending-0)`;
        incomplete = true;
      } else {
        path.classList.add(getParty(top.party));
        path.classList.add("leading");
        if (allReporting) path.classList.add("allin");
      }
    }
  }

  createLegend(candidate) {
    if (!candidate.id) return;
    var name = `${candidate.first} ${candidate.last}`;
    var specialShading =
      this.partyMap[candidate.party].length > 1
        ? this.partyMap[candidate.party].indexOf(candidate.last)
        : "";
    return (
      <div class="key-row">
        <div class={`swatch ${getParty(candidate.party)} i${specialShading}`}></div>
        <div class="name">{name}</div>
      </div>
    );
  }

  highlightCounty(fips) {
    if (!this.svg) return;
    var county = this.svg.querySelector(`[id="fips-${fips}"]`);
    if (county == this.lastClicked) return;
    if (this.lastClicked) this.lastClicked.classList.remove("clicked");
    county.parentElement.appendChild(county);
    county.classList.add("clicked");
    this.lastClicked = county;
  }

  onClick(e) {
    return;
    var county = e.target;
    var fips = county.id.replace("fips-", "");

    if (fips.length > 0) {
      // TODO: add back in some version of this to communicate county change?
      // this.dispatch("map-click", { fips });
      this.highlightCounty(fips);
    }
  }

  onMove(e) {
    var tooltip = this.tooltipRef.current;
    var fips = e.target.id.replace("fips-", "");

    if (!fips || e.type == "mouseleave") {
      tooltip.classList.remove("shown");
      return;
    }

    var result = this.fipsLookup[fips];
    if (result) {
      var displayCandidates = result.candidates.slice(0, 2);
      var candText = "";
      if (result.reportingPercent > 0.5) {
        candText = displayCandidates
          .map(
            c =>
              `<div class="row">
            <span class="party ${c.party}"></span>
            <span>${c.last}</span>
            <span class="amt">${
              c.percent ? reportingPercentage(c.percent) : "-"
            }%</span>
        </div>`
          )
          .join("");
      }

      // TODO: get the county name back in and check language around eevp
      var countyName = result.county.countyName.replace(/\s[a-z]/g, match =>
        match.toUpperCase()
      );
      var perReporting = reportingPercentage(result.reportingPercent);
      tooltip.innerHTML = `
        <div class="name"> ${countyName} </div>
        ${candText}
        <div class="row pop">Population <span class="amt"> ${formatters.comma(
          result.county.population
        )}</span></div>
        <div class="row reporting">${perReporting}% reporting</div>
      `;
    }

    var bounds = this.svg.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= tooltip.offsetWidth + 10;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }
}
