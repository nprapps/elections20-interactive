import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";
// import "./countyDataViz.less";

export class CountyDataViz extends Component {
  constructor(props) {
    super();

    this.graphicRef = createRef();
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {}

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    return (
      <div class="graphic">
        <ul></ul>
        <div class="graphic-wrapper" ref={this.graphicRef}></div>
      </div>
    );
  }
}
