import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import { getBucket } from "../util.js";

export default class BoardGovernor extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.setState({ races: data.results, test: data.test, latest });
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
    var { races, test, latest } = this.state;
    
    if (races) {

      var sorted = races.sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

      // var buckets = {
      //   likelyD: [],
      //   tossup: [],
      //   likelyR: [],
      // };

      // sorted.forEach(function (r) {
      //   var bucketRating = getBucket(r.rating);
      //   if (bucketRating) buckets[bucketRating].push(r);
      // });

      var half = Math.ceil(sorted.length / 2);    
      var firstHalf = sorted.splice(0, half);
      var secondHalf = sorted.splice(-half);
    }

    return <>
      <h1 tabindex="-1">Governor</h1>
      { test ? <TestBanner /> : "" }
      <div class="board-container Gov">
        {races && <>
          <Results races={firstHalf} office="Gov"/>
          <Results races={secondHalf} office="Gov"/>
        </>}
      </div>
      Results as of <DateFormatter value={latest} />
    </>;
  }
}
