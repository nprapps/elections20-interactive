import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled, styleJSX } from "../util.js";

import TestBanner from "../testBanner";

import Tabs from "../tabs";
import ElectoralBubbles from "../electoralBubbles";
import Cartogram from "../cartogram";
import NationalMap from "../nationalMap";

import Results from "../resultsBoardPresident";
import DateFormatter from "../dateFormatter";
import BoardKey from "../boardKey";

export function Leaderboard(props) {
  var { called } = props;

  return (
    <ul class="electoral-leaderboard">
      <li class="party dem">
        <label>Biden</label>
        {sumElectoral(called.Dem)}
      </li>

      <li class="party not-called">
        <label>Not Yet Called</label>
        {sumElectoral(called.uncalled)}
      </li>

      <li class="party gop">
        <label>Trump</label>
        {sumElectoral(called.GOP)}
      </li>
    </ul>
  );
}

export function ElectoralBars(props) {
  var { called } = props;
  var dWidth = sumElectoral(called.Dem) / 538 * 100;
  var rWidth = sumElectoral(called.GOP) / 538 * 100;

  return <div class="electoral-bars" aria-hidden="true">
    <div class="bar Dem" style={styleJSX({ width: dWidth + "%" })} />
    <div class="bar GOP" style={styleJSX({ width: rWidth + "%" })} />
    <hr class="victory">
      <span class="label">270</span>
    </hr>
  </div>
};

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

    var called = groupCalled(results);

    return <div class="president board">
      { test ? <TestBanner /> : "" }
      <h1 tabindex="-1">President</h1>

      <ElectoralBars called={called} />
      <Leaderboard called={called} />
      <hr class="divider" />

      <Tabs id="president-viz">

        <div icon="./assets/icons/ico-bubbles.svg" label="Margins">
          <ElectoralBubbles results={results} />
        </div>

        <div icon="./assets/icons/ico-cartogram.svg" label="Cartogram">
          {results && <Cartogram races={results} />}
        </div>

        <div icon="./assets/icons/ico-geo.svg" label="Map">
          {results && <NationalMap races={results} />}
        </div>
        
      </Tabs>

      <div label="Board" class="board-container President">
        {results && <>
          <Results races={buckets.tossup} hed="Competitive States" office="President" addClass="middle" split={true}/>
          <Results races={buckets.likelyD} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div>

      <BoardKey race="president"/>
      
      <div class="source">Source: AP (as of <DateFormatter value={latest} />)</div>
    </div>
  }
}
