import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";

export class BalanceOfPower extends Component {
  constructor(props) {
    super();
    console.log(InactiveSenateRaces);
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState({ data: json });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`/data/${this.props.race}.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`/data/${this.props.race}.json`, this.onData);
  }

  render() {
    if (!this.state.data) {
      return;
    }
    var results = this.getCongressBOP(this.state.data);
    // TODO: add in last updated to footer and senate footnote

    return (
      <div class={"leaderboard " + this.props.race}>
        <div class="results-header-group dem">
          <h2 class="party">Dem.: {results.Dem.total} </h2>
          <p class="detail">
            Net gains: 
            <span class="change party">
              { (results.Dem.gains > 0 ? '+' : '') + results.Dem.gains}
            </span>
            <br />
            Need: <span class="needed party">{results.Dem.need}</span>
          </p>
        </div>
        <div class="results-header-group gop">
          <h2 class="party">GOP: {results.GOP.total} </h2>
          <p class="detail">
            Net gains: 
            <span class="change party">
              {(results.GOP.gains > 0 ? '+' : '') + results.GOP.gains}
            </span>
            <br />
            Need: <span class="needed party">{results.GOP.need}</span>
          </p>
        </div>
        <div class="results-header-group other">
          <h2 class="party">Ind.: {results.Ind.total}</h2>
          <p class="detail">
            Net gains:
            <span class="change party">
              {(results.Ind.gains > 0 ? '+' : '') + results.Ind.gains}
            </span>
          </p>
        </div>
        <div class="results-header-group not-called">
          <h2 class="party">
            Not Yet
            <br />
            Called: {results.notCalled}
          </h2>
        </div>
      </div>
    );
  }

  getCongressBOP(data) {
    // TODO: Do we need to handle uncontested elections?
    // Hardcoded # of seats needed for majority in Senate/house
    var isSenate = this.props.race == 'senate';
    var seatsNeeded = isSenate ? 51 : 218;

    var inactiveGOP = isSenate ? parseInt(InactiveSenateRaces['GOP'].numSeats) : 0;
    var inactiveDem = isSenate ? parseInt(InactiveSenateRaces['Dem'].numSeats) : 0;
    var inactiveInd = isSenate ? parseInt(InactiveSenateRaces['Ind'].numSeats) : 0;

    var results = {
      GOP: { total: inactiveGOP, previous: inactiveGOP, gains: 0 },
      Dem: { total: inactiveDem, previous: inactiveDem, gains: 0 },
      Ind: { total: inactiveInd, previous: inactiveInd, gains: 0 },
    };

    var notCalled = 0;
    for (let race of data) {
      var winner = this.getWinner(race);
      if (winner) {
        results[winner.party].total += 1;
        if (winner.party != race.previousParty) {
          results[winner.party].gains += 1;
          results[race.previousParty].gains -= 1;
        }
      } else {
        notCalled += 1;
      }
      results[race.previousParty].previous += 1;
    }

    for (var key in results) {
      results[key].need = Math.max(seatsNeeded - results[key].previous, 0);
    }

    results.notCalled = notCalled;
    console.log(results)
    return results;
  }

  getWinner(race, party) {
    // Is this the right way to determine winner?
    // Can this be replaced by a util fxn?
    return race.candidates.filter(c => c.winner && c.winner == "X")[0];
  }
}
