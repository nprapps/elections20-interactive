import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import { BalanceOfPower } from "../balanceOfPower";
import house from "house.sheet.json";

export default class BoardHouse extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(races) {
    this.setState({ races });
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
    var { races } = this.state;
    if (!races) {
      return "";
    }

    var buckets = {};

    races.forEach(function(r) {
      var rating = house[r.id].rating;
      if (!buckets[rating]) buckets[rating] = [];
      buckets[rating].push(r);
    });

    return <>
      <h1>Key House Results</h1>
      <BalanceOfPower race="house" />
      <div class="board-container">
        <Results races={buckets["lean-d"]} hed="Dem. Lean"/>
        <Results races={buckets["toss-up"]} hed="Tossup"/>
        <Results races={buckets["lean-r"]} hed="Rep. Lean"/>
      </div>
    </>
  }
}
