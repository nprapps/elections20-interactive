import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import NationalMap from "../nationalMap";
import Results from "../resultsBoardPresident";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import states from "states.sheet.json";
import "./boardPresident.less";
import Tetris from "../tetris";

export default class BoardPresident extends Component {
  constructor(props) {
    super();

    this.state = {
      selectedTab: "ec-tetris"
    };
    this.onData = this.onData.bind(this);
    this.selectTab = this.selectTab.bind(this);
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

  selectTab(e) {
    var controls = e.target.getAttribute("aria-controls");
    var panel = this.base.querySelector("#" + controls);
    this.setState({ selectedTab: controls });
    setTimeout(() => panel.focus(), 50);
  }

  render(props, state) {
    var { races, test, latest } = this.state;

    if (races) {

      races.forEach(function(r) {
        r.name = states[r.state].name;
        r.districtDisplay = (r.district !== "AL") ? r.district : "";
      });

      var sorted = races.sort(function(a,b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        if (a.districtDisplay > b.districtDisplay) return 1;
        if (a.districtDisplay < b.districtDisplay) return -1;
        return 0;
      });

      var buckets = {
        likelyD: [],
        tossup: [],
        likelyR: []
      };

      sorted.forEach(function(r) {
        var stateName = r.state + (r.districtDisplay ? "-" + r.districtDisplay : "");
        var rating = states[stateName].rating;

        if (rating == "solid-d" || rating == "likely-d") {
          buckets.likelyD.push(r);
        } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
          buckets.tossup.push(r);
        } else if (rating == "solid-r" || rating == "likely-r") {
          buckets.likelyR.push(r);
        }
      });

      var called = {
        Dem: [],
        GOP: [], 
        uncalled: []
      }


      races.forEach(r => called[r.winnerParty || "uncalled"].push(r));

    }
    
    var tabs = [
      ["Tetris", "ec-tetris"],
      ["Geographic map", "national-map"]
    ];

    return <div class="president board">
      <h1>President</h1>
      { test ? <TestBanner /> : "" }
      <div class="tabs" role="tablist">
        {tabs.map(([label, data]) => (
          <button
            role="tab"
            aria-controls={data}
            aria-selected={(state.selectedTab == data).toString()}
            onClick={this.selectTab}
          >{label}</button>
        ))}
      </div>
      <div class="tabgroup">
        <div
          id="ec-tetris" role="tabpanel" tabindex="-1"
          class={state.selectedTab == "ec-tetris" ? "inactive" : "active"}
        >
          <div class="tetris-container">
            {races && <>
              <div class="uncalled">
                <b>Uncalled races</b>
                <ul>
                  {called.uncalled.map(c => <li>{c.state}</li>)}
                </ul>
              </div>
              <Tetris races={called.Dem} width={10} class="D" />
              <Tetris races={called.GOP} width={10} class="R" />
            </>}
          </div>
        </div>
        <div
          id="national-map" role="tabpanel" tabindex="-1"
          class={state.selectedTab == "national-map" ? "inactive" : "active"}
        >
          {races && <NationalMap races={races} />}
        </div>
      </div>
      <div class="board-container">
        {races && <>
          <Results races={buckets.tossup} hed="Lean/Tossup States" office="President" addClass="middle" />
          <Results races={buckets.likelyD} hed="Likely Dem." office="President" addClass="first" />
          <Results races={buckets.likelyR} hed="Likely GOP" office="President" addClass="last" />
        </>}
      </div>
      Results as of <DateFormatter value={latest}/>
    </div>
  }
}
