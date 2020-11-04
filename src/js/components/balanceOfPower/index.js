import { h, Component, Fragment } from "preact";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";
import {getParty} from "../util.js"

export default class BalanceOfPower extends Component {
  constructor(props) {
    super();

    this.isSenate = props.race == "senate";
    // Hardcoded # of seats needed for majority in Senate/house
    this.seatsNeeded = this.isSenate ? 51 : 218;
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {}

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.props.data) {
      return;
    }
    var results = this.getCongressBOP(this.props.data);

    return (
      <div class="leaderboard">
        <div class="results-header-group net-gain">
          <h2 class={"party " + results.netGainParty.toLowerCase()} title="">
            <label>
              Net gain
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
    // Get inactive races (pre-set in sheet)
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

    // For each race, if winner add to total and check if gain.
    results.notCalled = 0;
    for (let race of data) {
      var winner = this.getWinner(race);
      if (winner) {
        var winnerParty = getParty(winner.party);
        var previousWinner = getParty(race.previousParty);
        results[winner.party].total += 1;
        if (winnerParty != previousWinner) {
          results[winnerParty].gains += 1;
          results[previousWinner].gains -= 1;
        }
      } else {
        results.notCalled += 1;
      }
    }

    // Get party with the largest gain.
    var [top] = Object.keys(results)
      .map(k => ({ party: k, gains: results[k].gains }))
      .sort((a, b) => b.gains - a.gains);

    results.netGainParty = "none";
    if (top.gains > 0) {
      results.netGainParty = top.party;
      results.netGain = top.gains;
    }

    return results;
  }

  getWinner(race, party) {
    return race.candidates.filter(c => c.winner == "X")[0];
  }
}
