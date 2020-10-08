import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import { fmtComma, reportingPercentage } from "../util.js";
import "./countyMap.less";

var specialStates = new Set(["IA", "MA", "OK", "WA"]);

export class CountyMap extends Component {
  constructor(props) {
    super();

    this.fipsLookup = [];
    this.palette = { Dem: "#237bbd", GOP: "#d62021" };

    this.state = {};
    this.svgRef = createRef();
    this.containerRef = createRef();
    this.mapContainerRef = createRef();
    this.tooltipRef = createRef();
    this.guid = 0;
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    var response = await fetch(
      "../../assets/counties/" + this.props.state + ".svg"
    );
    var text = await response.text();
    var svg = await this.loadSVG(text);
    this.setState({ svg: svg });
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    var isChonky = specialStates.has(this.props.state);
    console.log(this.props.data[0].candidates);

    return (
      <div
        class={"county-map" + (isChonky ? " chonky" : "")}
        data-as="map"
        aria-hidden="true">
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
              {this.props.data[0].candidates.map(candidate =>
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

    svg.setAttribute("preserveAspectRatio", "xMaxYMid meet");

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

    if (width > height * 1.4) {
      var ratio = height / (width * 2);
      mapContainer.style.width = "100%";
      mapContainer.style.paddingBottom = `${100 * ratio}%`;
    } else {
      var ratio = width / height;
      if (embedded) {
        var w = 500;
        var h = w * ratio;
        if (w > window.innerWidth) {
          w = window.innerWidth - 32;
          h = w * ratio;
        }
        mapContainer.style.width = w + "px";
        mapContainer.style.height = h + "px";
      } else {
        var basis = height > width * 1.1 ? 65 : 55;
        mapContainer.style.width = basis + "vh";
        mapContainer.style.height = `${basis * ratio}vh`;
      }
    }

    // elements.aspect.style.paddingBottom = height / width * 100 + "%";
    this.containerRef.current.classList.toggle("horizontal", width < height);
  }

  paint() {
    var mapData = this.props.data;
    if (!this.svg) return;

    var incomplete = false;

    // Need to get the data in here first
    var winners = new Set();
    var hasVotes = false;
    for (var d of Object.keys(mapData)) {
      var [top] = mapData[d].candidates.sort((a, b) => b.percent - a.percent);
      if (top.votes) {
        winners.add(top.party in this.palette ? top.party : "other");
        hasVotes = true;
      }
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
      var pigment = this.palette[top.party];
      // TODO: eevp or precints reporting here and below
      var hitThreshold = mapData[d].reporting / mapData[d].precincts > 0.5;
      var paint = "#bbb";
      if (hitThreshold) {
        paint = pigment ? pigment : "#bbb";
      } else {
        paint = `url(#pending-${this.guid})`;
        incomplete = true;
      }

      path.style.fill = paint;
    }

    // TODO: get tooltip working again
    // if (hasVotes) {
    //   var pKeys = Object.keys(this.palette);
    //   var keyData = pKeys
    //     .map(p => this.palette[p])
    //     .sort((a, b) => (a.order < b.order ? -1 : 1));
    //   var filtered = keyData.filter(p => winners.has(p.id));
    //   keyData = filtered.length < 2 ? keyData.slice(0, 2) : filtered;
    //   elements.key.innerHTML = key({ keyData, incomplete, guid: this.guid });
    // }
  }

  createLegend(candidate) {
    if (!candidate.id) return;
    var name = `${candidate.first} ${candidate.last}`;
    return (
      <div class="key-row">
        <div
          class="swatch"
          style={`background: ${this.palette[candidate.party]};`}></div>
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
      return tooltip.classList.remove("shown");
    }

    // TODO: check syntax around leading candidate/winner
    var result = this.fipsLookup[fips];
    if (result) {
      var candText = "";
      if (result.reportingPercent > 0.5) {
        var leadingCandidate = result.candidates[0];
        var prefix = leadingCandidate.winner ? "Winner: " : "Leading: ";
        var candText = `${prefix}${leadingCandidate.last} (${
          leadingCandidate.percent
            ? reportingPercentage(leadingCandidate.percent)
            : 0
        }%)`;
      }

      // TODO: get the county name back in and check language around eevp
      var countyName = result.county.countyName.replace(/\s[a-z]/g, match =>
        match.toUpperCase()
      );
      var perReporting = reportingPercentage(result.reportingPercent);
      tooltip.innerHTML = `
        <div class="name">${countyName}</div>
        <div class="result">${candText}</div>
        <div class="reporting">${perReporting}% reporting</div>
        <div class="pop">Pop. ${fmtComma(
          result.county.census.population * 1
        )}</div>
      `;
    }

    var bounds = this.svgRef.current.getBoundingClientRect();
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
