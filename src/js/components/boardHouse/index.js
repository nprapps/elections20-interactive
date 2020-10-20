import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import BalanceOfPower from "../balanceOfPower";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";

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

    if (races) {
      var sorted = races.sort((a,b) => a.state > b.state ? 1 : a.state < b.state ? -1 : parseInt(a.seatNumber) > parseInt(b.seatNumber) ? 1 : parseInt(a.seatNumber) < parseInt(b.seatNumber) ? -1 : 0);

      var buckets = {};

      sorted.forEach(function(r) {
        if (!buckets[r.rating]) buckets[r.rating] = [];
        buckets[r.rating].push(r);
      });

      var halfTossUp = Math.ceil(buckets["toss-up"].length / 2);    
      var firstHalfTossUp = buckets["toss-up"].splice(0, halfTossUp);
      var secondHalfTossUp = buckets["toss-up"].splice(-halfTossUp);
    }

    return <>
      <h1 tabindex="-1">Key House Results</h1>
      { test ? <TestBanner /> : "" }
      <BalanceOfPower race="house" />
      <div class="board-container House">
        {races && <>
          <Results races={firstHalfTossUp} hed="Tossup States" office="House" addClass="middle" />
          <Results races={secondHalfTossUp} office="House" addClass="middle" />
          <Results races={buckets["lean-d"]} hed="Lean Democratic" office="House" addClass="first" />
          <Results races={buckets["lean-r"]} hed="Lean Republican" office="House" addClass="last" />
        </>}
      </div>
      Results as of <DateFormatter value={latest} />
    </>
  }
}
