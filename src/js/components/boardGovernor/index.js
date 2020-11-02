import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import BoardKey from "../boardKey";
import { getBucket } from "../util.js";

export default class BoardGovernor extends Component {
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
    gopher.watch(`./data/gov.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/gov.json`, this.onData);
  }

  render() {
    var { results, test, latest } = this.state;
    
    if (results) {
      var sorted = results.slice().sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
    }

    return <>
      { test ? <TestBanner /> : "" }
      
      <h1 tabindex="-1">Governor Results</h1>
      <div class="board-container Gov">
        {results && <>
          <Results races={sorted} office="Gov" split={true}/>
        </>}
      </div>
      <BoardKey race="gov"/>
      <div class="source">
        <div class="note">*Note: Expected vote is an Associated Press estimate of the share of total ballots cast in an election that have been counted. <a href="https://www.ap.org/en-us/topics/politics/elections/counting-the-vote">Read more about how EEVP is calculated</a>.</div>
        Source: AP (as of <DateFormatter value={latest} />)
      </div>
    </>;
  }
}
