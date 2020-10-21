import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import NationalMap from "../nationalMap";
import Results from "../resultsBoardPresident";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import "./boardPresident.less";
import Tetris from "../tetris";
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
    this.setState({ races: data.results, test: data.test, latest });
  }

  componentDidMount() {
    gopher.watch(`./data/president.json`, this.onData);
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/president.json`, this.onData);
  }

  render(props, state) {
    var { races, test, latest } = this.state;

    if (races) {
      races.forEach(function(r) {
        r.districtDisplay = (r.district !== "AL") ? r.district : "";
      });

      var sorted = races.sort(function(a,b) {
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

      var called = {
        Dem: [],
        GOP: [], 
        uncalled: []
      }

      races.forEach(r => called[r.winnerParty || "uncalled"].push(r));

      var halfTossUp = Math.ceil(buckets["tossup"].length / 2);    
      var firstHalfTossUp = buckets["tossup"].splice(0, halfTossUp);
      var secondHalfTossUp = buckets["tossup"].splice(-halfTossUp);
    }

    return <div class="president board">
      <h1 tabindex="-1">President</h1>
      { test ? <TestBanner /> : "" }
      <Tabs>

        <div label="Tetris">
          <div class="tetris-container">
            {races && <>
              <div class="uncalled">
                <b>Uncalled races</b>
                <ul>
                  {called.uncalled.map(c => <li>{c.state} ({c.electoral})</li>)}
                </ul>
              </div>
              <Tetris races={called.Dem} width={10} class="D" />
              <Tetris races={called.GOP} width={10} class="R" />
            </>}
          </div>
        </div>

        <div label="Geographic Map">
          {races && <NationalMap races={races} />}
        </div>
        
      </Tabs>
      <div class="board-container President">
        {races && <>
          <Results races={firstHalfTossUp} hed="Competitive States" office="President" addClass="middle" />
          <Results races={secondHalfTossUp} office="President" addClass="middle" />
          <Results races={buckets.likelyD} hed="Likely Democratic" office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely Republican" office="President" addClass="last" />
        </>}
      </div>
      Results as of <DateFormatter value={latest}/>
    </div>
  }
}
