// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component, createRef } from "preact";
import { buildDataURL, getHighestPymEmbed } from "./helpers.js";
import gopher from "../gopher.js";

var specialStates = new Set(['IA', 'MA', 'OK', 'WA']);

export class CountyMap extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.svgRef = createRef();
    this.tooltipRef = createRef();

    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState(json);
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

    return (
      <div class= {"county-map" + (isChonky ? " chonky" : "")} data-as="map" aria-hidden="true">
        <div class="container horizontal" data-as="container">
          <svg
            class="patterns"
            style="opacity: 0; position: absolute; left: -1000px"
          >
            <pattern
              id="pending-0"
              class="stripes"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-45)"
            >
              <path
                d="M5,0L5,10"
                stroke="rgba(0, 0, 0, .2)"
                stroke-width="4"
              ></path>
            </pattern>
          </svg>
          <div class="key" data-as="key">
            <div class="key-grid">
              <div class="key-row">
                <div class="swatch" style="background: #9999cb;"></div>
                <div class="name"></div>
              </div>
              <div class="key-row">
                <div class="swatch" style="background: #b7ce59;"></div>
                <div class="name"></div>
              </div>
            </div>
          </div>
          <div
            class="map-container"
            data-as="mapContainer"
            style="height: 65vh; width: 55.794vh;"
          >
            <div class="map" data-as="map">
              <div ref={this.svgRef}></div>
            </div>
            <div class="tooltip" ref={this.tooltipRef}>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    var svg = this.svgRef.current.getElementsByTagName('svg')[0];

    svg.setAttribute("preserveAspectRatio", "xMaxYMid meet");

    var paths = svg.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });

    var width = svg.getAttribute("width") * 1;
    var height = svg.getAttribute("height") * 1;

    svg.addEventListener("click", e => this.onClick(e));
    svg.addEventListener("mousemove", e => this.onMove(e));
    svg.addEventListener("mouseleave", e => this.onMove(e));
    // var embedded = document.body.classList.contains("embedded");

    // Move this to own function called in render?
    // if (width > height * 1.4) {
    //   var ratio = height / width;
    //   elements.mapContainer.style.width = "100%";
    //   elements.mapContainer.style.paddingBottom = `${100 * ratio}%`;
    // } //else {
    //   var ratio = width / height;
    //   if (embedded) {
    //     var w = 500;
    //     var h = w * ratio;
    //     if (w > window.innerWidth) {
    //       w = window.innerWidth - 32;
    //       h = w * ratio;
    //     }
    //     elements.mapContainer.style.height = w + "px";
    //     elements.mapContainer.style.width = h + "px";
    //   } else {
    //     var basis = height > width * 1.1 ? 65 : 55;
    //     elements.mapContainer.style.height = basis + "vh";
    //     elements.mapContainer.style.width = `${basis * ratio}vh`;
    //   }
    // }
    // // elements.aspect.style.paddingBottom = height / width * 100 + "%";
    // elements.container.classList.toggle("horizontal", width < height);

    this.svg = svg;

    this.paint();

    return svg;
  }

  paint() {

    if (!this.svg) return;

    // Need to get the data in here first
    // var winners = new Set();
    // var hasVotes = false;
    // this.state.results.forEach(r => {
    //   var [top] = r.candidates.sort((a, b) => b.percentage - a.percentage);
    //   if (top.votes) {
    //     winners.add(top.id in palette ? top.id : "other");
    //     hasVotes = true;
    //   }
    //   this.fipsLookup[r.fips] = r;
    // });

    // var lookup = {};
    // for (var r of results) {
    //   var { fips, candidates } = r;
    //   var [top] = candidates.sort((a, b) => b.percentage - a.percentage);
    //   if (!top.votes) continue;

    //   var path = this.svg.querySelector(`[id="fips-${fips}"]`);
    //   path.classList.add("painted");
    //   var pigment = palette[top.id];
    //   var hitThreshold = r.reportingPercentage > 25;
    //   var paint = "#bbb";
    //   if (hitThreshold) {
    //     paint = pigment ? pigment.color : "#bbb";
    //   } else {
    //     paint = `url(#pending-${this.guid})`;
    //     incomplete = true;
    //   }

    //   path.style.fill = paint;
    // }

    // if (hasVotes) {
    //   var pKeys = Object.keys(palette);
    //   var keyData = pKeys
    //     .map(p => palette[p])
    //     .sort((a, b) => (a.order < b.order ? -1 : 1));
    //   var filtered = keyData.filter(p => winners.has(p.id));
    //   keyData = filtered.length < 2 ? keyData.slice(0, 2) : filtered;
    //   elements.key.innerHTML = key({ keyData, incomplete, guid: this.guid });
    // }
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
      // TODO: add back in some version of this to communicate county change
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

    // Add back in when we have results
    // var result = this.fipsLookup[fips];
    // if (result) {
    //   var candText = "";
    //   if (result.reportingPercentage > 25) {
    //     var leadingCandidate = result.candidates[0];
    //     var prefix = leadingCandidate.winner ? "Winner: " : "Leading: ";
    //     var candText = prefix + leadingCandidate.last + " (" + (leadingCandidate.percentage || 0).toFixed(1) + "%)";
    //   }

    //   var countyDisplay = result.county.replace(/\s[a-z]/g, match =>
    //     match.toUpperCase()
    //   );
      tooltip.innerHTML = `
        <div class="name">${'test'}</div>
        <div class="pop">Pop. ${'test'}</div>
        <div class="result">${ 'test'}</div>
        <div class="reporting">${'test'}% reporting</div>
      `;
    // }

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
