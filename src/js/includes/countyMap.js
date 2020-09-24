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
    this.ref = createRef();

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
              <div ref={this.ref}></div>
            </div>
            <div
              class="tooltip"
              data-as="tooltip"
              style="left: 112.938px; top: 184.922px;"
            >
              <div class="name"></div>
              <div class="pop"></div>
              <div class="result"></div>
              <div class="reporting"></div>
            </div>
          </div>
        </div>
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

  async loadSVG(svgText) {
    this.ref.current.innerHTML = svgText;
    var svg = this.ref.current.getElementsByTagName('svg')[0];

    svg.setAttribute("preserveAspectRatio", "xMaxYMid meet");

    var paths = svg.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });

    var width = svg.getAttribute("width") * 1;
    var height = svg.getAttribute("height") * 1;
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
}
