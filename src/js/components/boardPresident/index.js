import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardPresident";
import states from "states.sheet.json";

export default class BoardPresident extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    this.setState({ races: data.results });
  }

  componentDidMount() {
    gopher.watch(`./data/president.json`, this.onData);
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/president.json`, this.onData);
  }

  render() {
    var { races } = this.state;
    if (!races) {
      return "";
    }

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

    return <>
      <h1>President</h1>
      <div class="placeholder">Map or dataviz</div>
      <div class="board-container">
        <Results races={buckets.likelyD} hed="Dem. Likely"/>
        <Results races={buckets.tossup} hed="Lean/Tossup"/>
        <Results races={buckets.likelyR} hed="GOP Likely"/>
      </div>
    </>
  }
}
