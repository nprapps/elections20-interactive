import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { formatters, reportingPercentage, getParty } from "../util.js";

export default class CountyMap extends Component {
  constructor(props) {
    super();

    this.fipsLookup = [];

    this.state = {};
    this.svgRef = createRef();
    this.containerRef = createRef();
    this.mapContainerRef = createRef();
    this.tooltipRef = createRef();
    this.width;
    this.height;

    // TODO: figure out whether to show candidates with >10% of vote but who haven't won
    // any counties on map and either add me back in or fix.
    // props.sortOrder = props.sortOrder.filter(s => props.data.some(d => d.candidates[0].last == s.last))

    // Helper for handling multiple candidates of same party on map.
    var partyMap = {};
    props.sortOrder.forEach(function (c) {
      if (!partyMap[c.party]) partyMap[c.party] = [];
      // if (props.data.some(d => d.candidates[0].last == c.last)) {
      partyMap[c.party].push(c.last);
      // }
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
    return (
      <div class="county-map" data-as="map" aria-hidden="true">
        <div ref={this.containerRef} class="container" data-as="container">
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
    var [svg] = this.svgRef.current.getElementsByTagName("svg");
    this.width = svg.getAttribute("width") * 1;
    this.height = svg.getAttribute("height") * 1;

    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    var paths = svg.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });

    svg.addEventListener("mousemove", e => this.onMove(e));
    svg.addEventListener("mouseleave", e => this.onMove(e));

    this.svg = svg;

    this.paint();
    this.updateDimensions();

    return svg;
  }

  updateDimensions() {
    if (!this.svg) return;

    // TODO: check if this needs updating
    var embedded = false; //document.body.classList.contains("embedded");
    var mapContainer = this.mapContainerRef.current;

    var innerWidth = window.innerWidth;
    var maxH = 400;
    var maxW = 600;

    var ratio = this.height / this.width;
    var w = Math.min(innerWidth - 40, maxW)
    var h = Math.min(w * ratio, maxH)

    this.svg.setAttribute("width", w + "px");
    this.svg.setAttribute("height", h + "px");

    this.containerRef.current.classList.toggle(
      "horizontal",
      this.width < this.height
    );
  }

  paint() {
    if (!this.svg) return;
    var mapData = this.props.data;

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
        path.style.fill = "#ddd";
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

    if (specialShading == -1) {
      return;
    }
    return (
      <div class="key-row">
        <div
          class={`swatch ${getParty(
            candidate.party
          )} i${specialShading}`}></div>
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

  onMove(e) {
    var tooltip = this.tooltipRef.current;
    var fips = e.target.id.replace("fips-", "");

    if (!fips || e.type == "mouseleave") {
      tooltip.classList.remove("shown");
      return;
    }

    var svg = this.svgRef.current.querySelector("svg");
    svg.appendChild(e.target);

    var result = this.fipsLookup[fips];
    if (result) {
      var displayCandidates = result.candidates.slice(0, 2);
      var candText = "";
      candText = displayCandidates
        .map(
          c =>
            `<div class="row">
            <span class="party ${c.party}"></span>
            <span>${c.last}</span>
            <span class="amt">${reportingPercentage(c.percent)}%</span>
        </div>`
        )
        .join("");

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
        <div class="row reporting">${perReporting}% in</div>
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
