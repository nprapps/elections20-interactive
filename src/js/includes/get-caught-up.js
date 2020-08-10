// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from "../gopher.js";

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
    gopher.watch('https://apps.npr.org/elections18-graphics/data/get-caught-up.json', this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch('https://apps.npr.org/elections18-graphics/data/get-caught-up.json', this.onData);
  }

  render() {
    if (!this.state.content) {
      return <div class="get-caught-up-wrapper"> "Loading..." </div>;
    } else if (false) {
      return <div></div>;
    }

    // setTimeout(window.pymChild.sendHeight, 0);
    var bullets = Object.keys(this.state.content)
            .filter(k => k.match(/^bullet/))
            .sort()
            .map(k => this.state.content[k]);

    var intros = Object.keys(this.state.content)
          .filter(k => k.match(/^intro/))
          .sort()
          .map(k => this.state.content[k]);

    return <div>
            <h2> Latest Election Headlines</h2>
            {intros.map(s => <p dangerouslySetInnerHTML={{__html: s}}></p>)}
            <ul>
              {bullets.map(s => <li dangerouslySetInnerHTML={{__html: s}}></li>)}
            </ul>
          </div>
    
  }
}