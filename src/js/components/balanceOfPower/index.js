import { h, Component, Fragment } from "preact";
import { determineResults, decideLabel, getMetaData } from "../util.js";
import gopher from "../gopher.js";

export class BalanceOfPower extends Component {
  constructor(props) {
    super();
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState({ data: json });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`/data/${this.props.json}`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`/data/${this.props.json}`, this.onData);
  }

  render() {
    if (!this.state.data) {
      return;
    }
    var results = this.getCongressBOP(this.state.data);
    // TODO: add in last updated to footer and senate footnote

    return (
      <div class="leaderboard">
        <div class="results-header-group dem">
          <h2 class="party">Dem.: {results.currentDem} </h2>
          <p class="detail">
            Net gains:
            <span class="change party">
              {results.currentDem - results.previousDem}
            </span>
            <br />
            Need: <span class="needed party">{results.needGOP}</span>
          </p>
        </div>
        <div class="results-header-group gop">
          <h2 class="party">GOP: {results.currentGOP} </h2>
          <p class="detail">
            Net gains:
            <span class="change party">
              {results.currentGOP - results.previousGOP}
            </span>
            <br />
            Need: <span class="needed party">{results.needGOP}</span>
          </p>
        </div>
        <div class="results-header-group other">
          <h2 class="party">Ind.: {results.currentInd}</h2>
          <p class="detail">
            Net gains:
            <span class="change party">
              {results.currentInd - results.previousInd}
            </span>
          </p>
        </div>
        <div class="results-header-group not-called">
          <h2 class="party">
            Not Yet
            <br />
            Called: {results.notYetCalled}
          </h2>
        </div>
      </div>
    );
  }

  getCongressBOP(data) {
    // TODO: Do we need to handle uncontested elections?
    // This makes some incorrect assumptions about where data is coming from, fix them
    var results = {};
    var majorParties = ["Dem", "GOP"];
    results.previousGOP = data.filter(r => r.previousParty == "GOP").length;
    results.previousDem = data.filter(r => r.previousParty == "Dem").length;
    results.previousInd = data.filter(
      r => r.previousParty && !majorParties.includes(r.previousParty)
    ).length;

    results.currentGOP = data.filter(r => this.isPartyWinner(r, "GOP")).length;
    results.currentDem = data.filter(r => this.isPartyWinner(r, "Dem")).length;
    results.currentInd = data.filter(r =>
      this.isPartyWinner(r, "Other")
    ).length;

    results.needDem = data.length + 1 - results.previousDem;
    results.needGOP = data.length + 1 - results.previousGOP;

    results.notYetCalled =
      data.length - results.currentGOP + results.currentDem + results.currentInd;

    return results;
  }

  isPartyWinner(race, party) {
    return !!race.candidates.filter(
      c => c.party == party && c.winner && c.winner != "N"
    ).length;
  }
}
