import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import BalanceOfPower from "../balanceOfPower";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import house from "house.sheet.json";
import states from "states.sheet.json";

export default class BoardHouse extends Component {
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
    gopher.watch(`./data/house.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/house.json`, this.onData);
  }

  render() {
    var { races, test, latest } = this.state;
    if (!races) {
      return "";
    }

    races.forEach(r => r.name = states[r.state].name);

    var sorted = races.sort((a,b) => a.name > b.name ? 1 : a.name < b.name ? -1 : parseInt(a.seatNumber) > parseInt(b.seatNumber) ? 1 : parseInt(a.seatNumber) < parseInt(b.seatNumber) ? -1 : 0);

    var buckets = {};

    sorted.forEach(function(r) {
      var rating = house[r.id] ? house[r.id].rating : "";
      if (!buckets[rating]) buckets[rating] = [];
      buckets[rating].push(r);
    });

    return <>
      <h1>Key House Results</h1>
      { test ? <TestBanner /> : "" }
      <BalanceOfPower race="house" />
      <div class="board-container">
        <Results races={buckets["lean-d"]} hed="Dem. Lean" office="House"/>
        <Results races={buckets["toss-up"]} hed="Tossup" office="House"/>
        <Results races={buckets["lean-r"]} hed="GOP Lean" office="House"/>
      </div>
      Results as of <DateFormatter value={latest} />
    </>
  }
}
