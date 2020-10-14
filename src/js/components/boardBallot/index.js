import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import TestBanner from "../testBanner";

export default class BoardBallot extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    this.setState({ races: data.results, test: data.test });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`./data/ballots.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/ballots.json`, this.onData);
  }

  render() {
    var { races, test } = this.state;
    if (!races) {
      return "";
    }

    return <>
      <h1>Ballot Initiatives</h1>
      { test ? <TestBanner /> : "" }
      <div class="board-container">
        <Results races={races} office="Ballot"/>
      </div>
    </>;
  }
}
