import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import states from "states.sheet.json";
import gov from "governors.sheet.json";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";

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

      races.forEach(r => r.name = states[r.state].name);

      var sorted = races.sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

      var buckets = {
        likelyD: [],
        tossup: [],
        likelyR: []
      };

      sorted.forEach(function(r) {
        var rating = gov[r.id].rating;

        if (rating == "solid-d" || rating == "likely-d") {
          buckets.likelyD.push(r);
        } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
          buckets.tossup.push(r);
        } else if (rating == "solid-r" || rating == "likely-r") {
          buckets.likelyR.push(r);
        }
      });
    }

    return <>
      <h1>Governor</h1>
      { test ? <TestBanner /> : "" }
      <div class="board-container">
        {races && <>
          <Results races={buckets.likelyD} hed="Safe/Likely Dem." office="Gov"/>
          <Results races={buckets.tossup} hed="Lean/Tossup States" office="Gov"/>
          <Results races={buckets.likelyR} hed="Safe/Likely GOP" office="Gov"/>
        </>}
      </div>
      Results as of <DateFormatter value={latest} />
    </>;
  }
}
