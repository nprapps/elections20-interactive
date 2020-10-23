import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import NationalMap from "../nationalMap";
import Results from "../resultsBoardPresident";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import ElectoralArc from "../electoralArc";
import BoardKey from "../boardKey";
import Tabs from "../tabs";
import { getBucket } from "../util.js";

export default class BoardPresident extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.setState({ ...data, latest });
  }

  componentDidMount() {
    gopher.watch(`./data/president.json`, this.onData);
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/president.json`, this.onData);
  }

  render(props, state) {
    var { results, test, latest } = this.state;

    if (results) {
      results.forEach(function(r) {
        r.districtDisplay = (r.district !== "AL") ? r.district : "";
      });

      var sorted = results.sort(function(a,b) {
        if (a.stateName > b.stateName) return 1;
        if (a.stateName < b.stateName) return -1;
        if (a.districtDisplay > b.districtDisplay) return 1;
        if (a.districtDisplay < b.districtDisplay) return -1;
        return 0;
      });

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

    return <div class="president board">
      <h1 tabindex="-1">President</h1>
      { test ? <TestBanner /> : "" }
      <Tabs>

        <div label="Breakdown">
          <ElectoralArc results={results} />
        </div>

        <div label="Geographic Map">
          {results && <NationalMap races={results} />}
        </div>
        
      </Tabs>

      <BoardKey />
      <div class="board-container President">
        {results && <>
          <Results races={buckets.tossup} hed="Competitive States" office="President" addClass="middle" split={true}/>
          <Results races={buckets.likelyD} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div>
      <div class="source">Source: AP (as of <DateFormatter value={latest} />)</div>
    </div>
  }
}
