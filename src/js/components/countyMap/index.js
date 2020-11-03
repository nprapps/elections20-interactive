import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import {
  formatters,
  reportingPercentage,
  getParty,
  getPartyPrefix,
  isSameCandidate,
  getCountyCandidates,
} from "../util.js";

export default class CountyMap extends Component {
  constructor(props) {
    super();

    this.fipsLookup = [];

    this.handleResize = this.handleResize.bind(this);
    this.state = {};
    this.svgRef = createRef();
    this.containerRef = createRef();
    this.mapContainerRef = createRef();
    this.tooltipRef = createRef();
    this.width;
    this.height;

    // Only display candidates that are winning a county
    var legendCands = getCountyCandidates(props.sortOrder, props.data);

    // Add in special marker if more than one candidate of same party is winning a county.
    var specialCount = 1;
    legendCands.forEach(function (c, index) {
      if (
        legendCands.filter(l => getParty(l.party) == getParty(c.party)).length >
        1
      ) {
        c.special = specialCount;
        specialCount += 1;
      }
    });
    this.legendCands = legendCands;
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var response = await fetch(
      "./assets/counties/" + this.props.state + ".svg"
    );
    var text = await response.text();
    var svg = await this.loadSVG(text);
    this.setState({ svg: svg });

    window.addEventListener("resize", this.handleResize);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    window.removeEventListener("resize", this.handleResize);
  }

  componentDidUpdate() {
    this.paint();
  }

  handleResize() {
    var newWidth = window.innerWidth;
    if (!this.state.width || newWidth != this.state.width) {
      this.setState({
        width: newWidth,
      });
      this.updateDimensions();
    }
  }

  render() {
    return (
      <div class="county-map" data-as="map" aria-hidden="true">
        <div ref={this.containerRef} class="container" data-as="container">
          <div class="key" data-as="key">
            <div class="key-grid">
              {this.legendCands.map(candidate => this.createLegend(candidate))}
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
    var w = Math.min(innerWidth - 40, maxW);
    var h = Math.min(w * ratio, maxH);

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

      if (!hitThreshold) {
        path.style.fill = "#e1e1e1";
        incomplete = true;
      } else {
        var [candidate] = this.legendCands.filter(c => isSameCandidate(c, top));
        if (candidate.special) path.classList.add(`i${candidate.special}`);
        path.classList.add(getParty(top.party));
        path.classList.add("leading");
        if (allReporting) path.classList.add("allin");
      }
    }
  }

  createLegend(candidate) {
    if (!candidate.id) return;
    var name = `${candidate.last}`;
    var specialShading = candidate.special;
    return (
      <div class="key-row">
        <div
          class={`swatch ${getParty(
            candidate.party
          )} i${specialShading}`}></div>
        <div class="name">{`${name}`}</div>
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
      var legendCands = this.legendCands;
      candText = displayCandidates
        .map(cand => {
          var [candidate] = legendCands.filter(c => isSameCandidate(c, cand));
          var inStateTop = !!this.props.sortOrder.filter(c =>
            isSameCandidate(c, cand)
          ).length;
          var special =
            candidate && candidate.special ? `i${candidate.special}` : "";
          var cs = `<div class="row">
            <span class="party ${cand.party} ${special}"></span>
            <span>${cand.last} ${
            !inStateTop ? `(${getParty(cand.party)})` : ""
          }</span>
            <span class="amt">${reportingPercentage(cand.percent)}%</span>
        </div>`;
          return cand.percent > 0 ? cs : "";
        })
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
      x -= 150;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }
}
