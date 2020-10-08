import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed";
import { BalanceOfPower } from "../balanceOfPower";

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

    return <>
      <h1>Key House Results</h1>
      <BalanceOfPower race="house" />
      <div class="board-container">
        <Results races={races} hed="Dem. Likely"/>
        <Results races={races} hed="Tossup"/>
        <Results races={races} hed="Rep. Likely"/>
      </div>
    </>
  }
}
