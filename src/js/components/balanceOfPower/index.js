import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";
import "./balanceOfPower.less";

export default class BalanceOfPower extends Component {
  constructor(props) {
    super();

    this.isSenate = props.race == "senate";
    this.seatsNeeded = this.isSenate ? 51 : 218;
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState({ data: json.results });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`./data/${this.props.race}.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/${this.props.race}.json`, this.onData);
  }

  render() {
    if (!this.state.data) {
      return;
    }
    var results = this.getCongressBOP(this.state.data);

    // TODO: add in check icon
    return (
      <div class="leaderboard">
        <div class="results-header-group net-gain">
          <h2 class={"party " + results.netGainParty.toLowerCase()} title="">
            <label class={results.netGainParty == "none" ? "hidden" : ""}>
              Net change
            </label>
            <abbr title="">
              {results.netGainParty != "none"
                ? results.netGainParty + " +" + results.netGain
                : "No change"}
            </abbr>
          </h2>
        </div>
        <div class="results-header-group dem">
          <h2 class="party">
            <label> Dem. {this.getWinnerIcon(results.Dem.total)}</label>
            <abbr>{results.Dem.total}</abbr>
          </h2>
        </div>
        <div class="results-header-group gop">
          <h2 class="party">
            <label> GOP {this.getWinnerIcon(results.GOP.total)}</label>
            <abbr>{results.GOP.total}</abbr>
          </h2>
        </div>
        <div class="results-header-group other">
          <h2 class="party">
            <label>Ind.</label>
            <abbr>{results.Ind.total}</abbr>
          </h2>
        </div>
        <div class="results-header-group not-called">
          <h2 class="party">
            <label>Not Yet Called</label>
            <abbr>{results.notCalled}</abbr>
          </h2>
        </div>
      </div>
    );
  }

  getWinnerIcon(total) {
    if (total >= this.seatsNeeded) {
      return (
        <span class="winner-icon" role="img" aria-label="check mark">
          <svg
            aria-hidden="true"
            focusable="false"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512">
            <path
              fill="#333"
              d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
          </svg>
        </span>
      );
    }
  }

  getCongressBOP(data) {
    // TODO: Do we need to handle uncontested elections? Do they have winner marked?
    // Hardcoded # of seats needed for majority in Senate/house
    var inactiveGOP = this.isSenate ? parseInt(InactiveSenateRaces["GOP"]) : 0;
    var inactiveDem = this.isSenate ? parseInt(InactiveSenateRaces["Dem"]) : 0;
    var inactiveInd = this.isSenate
      ? parseInt(InactiveSenateRaces["Other"])
      : 0;

    var results = {
      GOP: { total: inactiveGOP, gains: 0 },
      Dem: { total: inactiveDem, gains: 0 },
      Ind: { total: inactiveInd, gains: 0 },
    };

    var notCalled = 0;
    for (let race of data) {
      var winner = this.getWinner(race);
      if (winner) {
        var winnerParty = this.getParty(winner.party);
        var previousWinner = this.getParty(race.previousParty);
        results[winner.party].total += 1;
        if (winnerParty != previousWinner) {
          results[winnerParty].gains += 1;
          results[previousWinner].gains -= 1;
        }
      } else {
        notCalled += 1;
      }
    }

    // Get party with the largest gain.
    var sorted = Object.keys(results)
      .map(k => ({ party: k, gains: results[k].gains }))
      .sort((a, b) => b.gains - a.gains)[0];

    results.netGainParty = "none";
    if (sorted.gains > 0) {
      results.netGainParty = sorted.party;
      results.netGain = sorted.gains;
    }
    
    results.notCalled = notCalled;
    return results;
  }

  getParty(party) {
    if (["Dem", "GOP"].includes(party)) {
      return party;
    }
    return "Ind";
  }

  getWinner(race, party) {
    // Is this the right way to determine winner?
    // Can this be replaced by a util fxn?
    return race.candidates.filter(c => c.winner == "X")[0];
  }
}
