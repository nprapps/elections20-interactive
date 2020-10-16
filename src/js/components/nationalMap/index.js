import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
import "./nationalMap.less";

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
      </div>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    this.paint(this.props);
  }

  paint(props) {
    var mapData = props.races;
    if (!this.svgRef.current) return;
    var svg = this.svgRef.current.querySelector("svg");

    mapData.forEach(function(r) {
      // console.log(r)
      var eevp = r.eevp;
      var district = r.district;
      var state = r.state.toLowerCase() + (district ? "-" + district : "");
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var paths = svg.querySelectorAll(`.${state}`);
      if (!paths) return;

      paths.forEach(function(p) {
        if (eevp > 0.5) {
          p.classList.add("leader");
          p.classList.add(leader);
        }
        if (winner) {
          p.classList.remove("leader");
          p.classList.remove(leader);
          p.classList.add("winner");
          p.classList.add(winner);
        }
      })
    })
  }
}
