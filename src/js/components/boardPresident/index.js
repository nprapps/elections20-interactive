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

  onData(races) {
    this.setState({ races });
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

    var buckets = {
      likelyD: [],
      tossup: [],
      likelyR: []
    };

    races.forEach(function(r) {
      var district = (r.district !== "AL") ? r.district : "";
      var stateName = r.state + (district ? "-" + r.district : "");
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
