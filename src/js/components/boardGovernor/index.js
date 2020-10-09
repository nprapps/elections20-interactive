import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import states from "states.sheet.json";

export default class BoardGovernor extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(races) {
    this.setState({ races });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`./data/gov.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/gov.json`, this.onData);
  }

  render() {
    var { races } = this.state;
    if (!races) {
      return "";
    }

    races.forEach(r => r.name = states[r.state].name);

    var sorted = races.sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

    return <>
      <h1>Governor</h1>
      <div class="board-container">
        <Results races={sorted}/>
      </div>
    </>;
  }
}
