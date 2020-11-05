import { h, Fragment, Component, render } from "preact";
import { ElectoralBars, Leaderboard } from "./components/boardPresident";
import NationalMap from "./components/nationalMap";
import ElectoralBubbles from "./components/electoralBubbles";
import Cartogram from "./components/cartogram";
import DateFormatter from "./components/dateFormatter";
import TestBanner from "./components/testBanner";
import Tabs from "./components/tabs";
import { groupCalled, sumElectoral, getBucket } from "./components/util.js";
import $ from "./lib/qsa";
import gopher from "./components/gopher";

import Sidechain from "@nprapps/sidechain";
Sidechain.registerGuest();

export default class Homepage extends Component {
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

    results.forEach(function(r) {
      r.districtDisplay = (r.district !== "AL") ? r.district : "";
    });

    var early = results.filter(r => !r.called && r.eevp <= .5 && r.eevp).length;
    var silent = results.filter(r => !r.called && !r.eevp).length;

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

    var search = new URLSearchParams(window.location.search);
    var display = search.get("display");

    return <div class="president board">
      { test ? <TestBanner /> : "" }
      <ElectoralBars called={called} />
      <Leaderboard called={called} />

      {results && results.length && <Tabs id="homepage-viz">

        <div icon="./assets/icons/ico-geo.svg" label="Geography" selected={display == "map"}>
          <NationalMap races={results} />
        </div>

        <div icon="./assets/icons/ico-cartogram.svg" label="Electoral" selected={display == "cartogram"}>
          <Cartogram races={results} />
        </div>

        <div icon="./assets/icons/ico-bubbles.svg" label="Margins" selected={display == "margins"}>
          <ElectoralBubbles results={results}  buckets={buckets} />
        </div>
      </Tabs>}

      { false && <div label="Board" class="board-container President">
        {results && <>
          <Results races={buckets.tossup} hed="Competitive States" office="President" addClass="middle" split={true}/>
          <Results races={buckets.likelyD} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div> }

      <div class="full-link"><a href="https://apps.npr.org/elections20-interactive/">See full results ›</a></div>

      <div class="source">Source: AP (as of <DateFormatter value={latest} />)</div>
    </div>
  }
}

render(<Homepage />, $.one(".embed-homepage"));

window.addEventListener("hashchange", function(e) {
  var hashed = `https://apps.npr.org/elections20-interactive/${window.location.hash}`;
  var a = document.createElement("a");
  a.href = hashed;
  a.click();
});
