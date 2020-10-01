// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component } from "preact";

import gopher from "../gopher.js";
import Countdown from "../countdown";

var lastRequestTime;
var initialized = false;
var useDebug = false;
var isValidMarkup;

export class GetCaughtUp extends Component {
  constructor() {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState(json.gcu);
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch("./data/topResults.json", this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch("./data/topResults.json", this.onData);
  }

  render() {
    if (!this.state.headline) {
      return <div class="get-caught-up-wrapper"> "Loading..." </div>;
    }
    return (
      <div>
        <h2 dangerouslySetInnerHTML={{ __html: this.state.headline }}></h2>
        <p dangerouslySetInnerHTML={{ __html: this.state.text }}></p>
        <Countdown />
      </div>
    );
  }
}
