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

  render() {
    return (
      <div ref={this.svgRef}></div>
    );
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    var svg = this.svgRef.current.getElementsByTagName("svg")[0];
    return svg;
  }

  
  

}
