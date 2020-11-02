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

var winnerIcon =
  <span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>;

export function Leaderboard(props) {
  var { called } = props;

  return (
    <ul class="electoral-leaderboard">
      <li class="party dem">
        <label>Biden {sumElectoral(called.Dem) >= 270 ? winnerIcon : ""}</label>
        {sumElectoral(called.Dem)}
      </li>

      {sumElectoral(called.uncalled) ?
        <li class="party not-called">
          <label>Not Yet Called</label>
          {sumElectoral(called.uncalled)}
        </li>
      : ""}

      <li class="party gop">
        <label>Trump {sumElectoral(called.GOP) >= 270 ? winnerIcon : ""}</label>
        {sumElectoral(called.GOP)}
      </li>

      {sumElectoral(called.Other) ?
        <li class="party other">
          <label>Other {sumElectoral(called.Other) >= 270 ? winnerIcon : ""}</label>
          {sumElectoral(called.Other)}
        </li>
      : ""}
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
      <span class="label">270 to win</span>
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
    var { results = [], test, latest } = this.state;

    var buckets = {
      likelyD: [],
      tossup: [],
      likelyR: [],
    };

    results.forEach(function(r) {
      r.districtDisplay = (r.district !== "AL") ? r.district : "";
    });

    var sorted = results.slice().sort(function(a,b) {
      if (a.stateName > b.stateName) return 1;
      if (a.stateName < b.stateName) return -1;
      if (a.districtDisplay > b.districtDisplay) return 1;
      if (a.districtDisplay < b.districtDisplay) return -1;
      return 0;
    });

    sorted.forEach(function (r) {
      var bucketRating = getBucket(r.rating);
      if (bucketRating) buckets[bucketRating].push(r);
    });

    var called = groupCalled(results);

    return <div class="president board">
      { test ? <TestBanner /> : "" }

      <ElectoralBars called={called} />

      <h1 tabindex="-1">Presidential Results</h1>

      <Leaderboard called={called} />
      <hr class="divider" />

      <Tabs id="president-viz">

        <div icon="./assets/icons/ico-geo.svg" label="Geography">
          <NationalMap races={results} />
        </div>

        <div icon="./assets/icons/ico-cartogram.svg" label="Electoral">
          <Cartogram races={results} />
        </div>

        <div icon="./assets/icons/ico-bubbles.svg" label="Margins">
          <ElectoralBubbles results={results} buckets={buckets} />
        </div>
        
      </Tabs>

      <div label="Board" class="board-container President">
        {results && <>
          <Results races={buckets.tossup.slice()} hed="Competitive States" office="President" addClass="middle" split={true}/>
          <Results races={buckets.likelyD.slice()} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR.slice()} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div>

      <BoardKey race="president"/>

      <div class="source">
        <div class="note">*Note: Expected vote is an Associated Press estimate of the share of total ballots cast in an election that have been counted. <a href="https://www.ap.org/en-us/topics/politics/elections/counting-the-vote">Read more about how EEVP is calculated</a>.</div>
        Source: AP (as of <DateFormatter value={latest} />). Presidential race ratings from <a href="https://www.npr.org/2020/10/30/929077049/final-npr-electoral-map-biden-has-the-edge-but-trump-retains-narrow-path">NPR</a>.
      </div>
    </div>
  }
}
