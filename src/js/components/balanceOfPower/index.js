import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import InactiveSenateRaces from "inactive_senate_races.sheet.json";

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
            <label>Dem.</label>
            <abbr>{results.Dem.total}</abbr>
          </h2>
        </div>
        <div class="results-header-group gop">
          <h2 class="party">
            <label>
              GOP
            </label>
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

  getCongressBOP(data) {
    // TODO: Do we need to handle uncontested elections? Do they have winner marked?
    // Hardcoded # of seats needed for majority in Senate/house
    var isSenate = this.props.race == "senate";
    var seatsNeeded = isSenate ? 51 : 218;

    var inactiveGOP = isSenate ? parseInt(InactiveSenateRaces["GOP"]) : 0;
    var inactiveDem = isSenate ? parseInt(InactiveSenateRaces["Dem"]) : 0;
    var inactiveInd = isSenate ? parseInt(InactiveSenateRaces["Other"]) : 0;

    var results = {
      GOP: { total: inactiveGOP, gains: 0 },
      Dem: { total: inactiveDem, gains: 0 },
      Ind: { total: inactiveInd, gains: 0 },
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
    }

    // TODO: check how this is calculated/that this holds up
    // Handle Ind?
    results.netGainParty = "none";
    if (results.GOP.gains > results.Dem.gains) {
      results.netGainParty = "GOP";
    } else if (results.Dem.gains > results.GOP.gains) {
      results.netGainParty = "Dem";
    }
    results.netGain = Math.abs(results.GOP.gains) + Math.abs(results.Dem.gains);
    results.notCalled = notCalled;
    return results;
  }

  getWinner(race, party) {
    // Is this the right way to determine winner?
    // Can this be replaced by a util fxn?
    return race.candidates.filter(c => c.winner && c.winner == "X")[0];
  }
}
