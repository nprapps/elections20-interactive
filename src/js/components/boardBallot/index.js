import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import BoardKey from "../boardKey";

export default class BoardBallot extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.setState({ ...data, latest });
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
    var { results, test, latest } = this.state;

    return <>
      <h1 tabindex="-1">Ballot Initiatives</h1>
      { test ? <TestBanner /> : "" }

      <div class="board-container">
        {results && <Results races={results} office="Ballot"/>}
      </div>
      <BoardKey race="ballot"/>
      <div class="source">
        <div class="note">Note: Expected vote is an Associated Press estimate of how much of the vote in an election has been counted. <a href="https://www.ap.org/en-us/topics/politics/elections/counting-the-vote">Read more about how EEVP is calculated</a>.</div>
        Source: AP (as of <DateFormatter value={latest} />)
      </div>
    </>;
  }
}
