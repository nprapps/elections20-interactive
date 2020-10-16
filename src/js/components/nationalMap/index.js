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
    var response = await fetch("./assets/ico-geo.svg");
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
      console.log(r)
      var eevp = r.eevp;
      var state = r.state.toLowerCase();
      var leader = r.candidates[0].party;
      var winner = r.winnerParty;
      var path = svg.querySelector(`.${state}`);
      if (!path) return;

      if (eevp > 0.5) {
        path.classList.add("leader");
        path.classList.add(leader);
      }
      if (winner) {
        path.classList.remove("leader");
        path.classList.remove(leader);
        path.classList.add("winner");
        path.classList.add(winner);
      }
    })
  }
}
