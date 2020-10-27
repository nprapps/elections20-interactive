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
    var { results, test, latest } = this.state;

    if (results) {
      results.forEach(function(r) {
        r.districtDisplay = (r.district !== "AL") ? r.district : "";
      });
    }

    var called = groupCalled(results);

    var search = new URLSearchParams(window.location.search);
    var Display = search.get("display") == "map" ? NationalMap :
                  search.get("display") == "cartogram" ? Cartogram : 
                  ElectoralBubbles;

    return <div class="president board">
      { test ? <TestBanner /> : "" }
      <ElectoralBars called={called} />
      <Leaderboard called={called} />

      <Tabs id="president-viz">

        <div icon="./assets/icons/ico-bubbles.svg" label="Margins">
          <ElectoralBubbles results={results} />
        </div>

        <div icon="./assets/icons/ico-cartogram.svg" label="Electoral">
          <Cartogram races={results} />
        </div>

        <div icon="./assets/icons/ico-geo.svg" label="Geography">
          <NationalMap races={results} />
        </div>
        
      </Tabs>

      { false && <div label="Board" class="board-container President">
        {results && <>
          <Results races={buckets.tossup} hed="Competitive States" office="President" addClass="middle" split={true}/>
          <Results races={buckets.likelyD} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div> }
      
      <div class="source">Source: AP (as of <DateFormatter value={latest} />)</div>
    </div>
  }
}

render(<Homepage />, $.one(".embed-homepage"));