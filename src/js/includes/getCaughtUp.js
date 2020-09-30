// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component } from "preact";

import marked from "marked";

import { buildDataURL, getHighestPymEmbed } from "./helpers.js";
import gopher from "../gopher.js";
import Countdown from "./countdown.js";

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
    this.setState(json);
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch("/data/get-caught-up.json", this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch("/data/get-caught-up.json", this.onData);
  }

  render() {
    if (!this.state.published) {
      return <div class="get-caught-up-wrapper"> "Loading..." </div>;
    }
    return (
      <div>
        <h2 dangerouslySetInnerHTML={{ __html: this.state.headline }}></h2>
        <p dangerouslySetInnerHTML={{ __html: marked(this.state.text) }}></p>
        <Countdown />
      </div>
    );
  }
}