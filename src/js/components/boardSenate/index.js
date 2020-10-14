import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import BalanceOfPower from "../balanceOfPower";
import TestBanner from "../testBanner";
import senate from "senate.sheet.json";
import states from "states.sheet.json";

export default class BoardSenate extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    this.setState({ races: data.results, test: data.test });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`./data/senate.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/senate.json`, this.onData);
  }

  render() {
    var { races, test } = this.state;
    if (!races) {
      return "";
    }

    races.forEach(r => r.name = states[r.state].name);

    var sorted = races.sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

    var buckets = {
      likelyD: [],
      tossup: [],
      likelyR: []
    };

    sorted.forEach(function(r) {
      var rating = senate[r.id].rating;

      if (rating == "solid-d" || rating == "likely-d") {
        buckets.likelyD.push(r);
      } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
        buckets.tossup.push(r);
      } else if (rating == "solid-r" || rating == "likely-r") {
        buckets.likelyR.push(r);
      }
    });

    return (
      <Fragment>
        <h1>Senate</h1>
        { test ? <TestBanner /> : "" }
        <BalanceOfPower race="senate" />
        <div class="board-container">
          <Results races={buckets.likelyD} hed="Dem. Solid/Likely"/>
          <Results races={buckets.tossup} hed="Lean/Tossup"/>
          <Results races={buckets.likelyR} hed="GOP Solid/Likely"/>
        </div>
      </Fragment>
    );
  }
}
