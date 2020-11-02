import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import BalanceOfPower from "../balanceOfPower";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import BoardKey from "../boardKey";
import { getBucket } from "../util.js";

export default class BoardSenate extends Component {
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
    gopher.watch(`./data/senate.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/senate.json`, this.onData);
  }

  render() {
    var { results, test, latest, alert } = this.state;

    if (results) {
      var sorted = results.slice().sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

      var buckets = {
        likelyD: [],
        tossup: [],
        likelyR: [],
      };

      sorted.forEach(function (r) {
        var bucketRating = getBucket(r.rating);
        if (bucketRating) buckets[bucketRating].push(r);
      });
    }

    return (
      <Fragment>
        { test ? <TestBanner /> : "" }
        <div class="header">
          <div class="title-wrapper">
            <h1 tabindex="-1">Senate Results</h1>
            <div class="alert" dangerouslySetInnerHTML={({ __html: alert })} />
          </div>
          <div class="bop-wrapper">
            <BalanceOfPower race="senate" data={results}/>
          </div>
        </div>

        <div class="board-container Senate">
          {results && <>
            <Results races={buckets.tossup} hed="Competitive Seats" office="Senate" addClass="middle" split={true}/>
            <Results races={buckets.likelyD} hed="Likely Democratic" office="Senate" addClass="first"/>
            <Results races={buckets.likelyR} hed="Likely Republican" office="Senate" addClass="last"/>
          </>}
        </div>
        <BoardKey race="senate"/>
        <div class="source">
          <div class="note">*Note: Expected vote is an Associated Press estimate of the share of total ballots cast in an election that have been counted. <a href="https://www.ap.org/en-us/topics/politics/elections/counting-the-vote">Read more about how EEVP is calculated</a>.</div>
          Source: AP (as of <DateFormatter value={latest} />). U.S. Senate race ratings from the nonpartisan <a href="https://cookpolitical.com/ratings/senate-race-ratings">Cook Political Report</a>. Seats listed as Likely Democratic or Likely Republican include contests rated as "Solid" and "Likely" for a particular party. Seats listed as Competitive include contests rated as leaning to a particular party, or a toss-up.
        </div>
      </Fragment>
    );
  }
}
