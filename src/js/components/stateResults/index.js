// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component } from "preact";
import gopher from "../gopher.js";
import { KeyResults } from "../keyResults";
import { HouseResults } from "../houseResults";
import { StatewideResults } from "../statewide";
import stateLookup from "states.sheet.json";
import { getViewFromRace } from "../util.js";
import { toTitleCase } from "../../includes/helpers.js";

// TODO: check on the use of all of these
const STATES_WITHOUT_COUNTY_INFO = ["AK"];
const STATES_WITH_POTENTIAL_RUNOFFS = ["GA", "LA", "MS"];
const NEW_ENGLAND_STATES = ["ME", "NH", "VT", "MA", "CT", "RI"];

export class StateResults extends Component {
  constructor(props) {
    super();

    this.state = {
      activeView: props.activeView,
    };
    this.onData = this.onData.bind(this);
    this.onResultsData = this.onResultsData.bind(this);
    this.switchResultsView = this.switchResultsView.bind(this);
  }

  onData(json) {
    this.setState(json);
  }

  onResultsData(json) {
    var activeRaces = new Set(["key"]);
    var raceIds = {};
    // TODO: add back in legend item suppression
    // TODO: handle special senate elections?
    Object.keys(json).forEach(function (item) {
      if (json[item].office != "I") {
        var office = getViewFromRace(json[item].office);
        activeRaces.add(office);
        if (!raceIds[office]) {
          raceIds[office] = [];
        }
        raceIds[office].push(json[item].id);
      }
    });
    this.setState({
      races: json,
      activeRaces: Array.from(activeRaces),
      ids: raceIds,
    });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`/data/states/${this.props.state}.json`, this.onResultsData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`/data/states/${this.props.state}.json`, this.onResultsData);
  }

  render() {
    if (!this.props.state || !this.state.races) {
      return <div> "Loading..." </div>;
    }

    // TODO: Grab state name from a mapping or include it in json
    let stateName = stateLookup[this.props.state];

    let resultsType = `${this.state.activeView.toUpperCase()} Results`;
    return (
      <div class="results">
        <header id="state-header">
          <div class="state-icon">
            <i class={"stateface stateface-" + this.props.state}></i>
          </div>
          <h1>
            <img
              class="icon"
              src={"../../assets/states/" + this.props.state + ".svg"}></img>
            <span class="state-name">{stateName}</span>
            {resultsType}
          </h1>
          {this.renderTabSwitcher()}
        </header>
        <div class="results-elements">{this.renderResults()}</div>
      </div>
    );
  }

  renderResults() {
    // Render race data elements, depending on which race-type tab is active
    let resultsElements;

    if (this.state.activeView === "key") {
      return <KeyResults state={this.props.state} />;
    } else if (this.state.activeView === "house") {
      return <HouseResults state={this.props.state} />;
    } else if (
      this.state.activeView.match(/senate/) ||
      this.state.activeView == "governor" ||
      this.state.activeView == "president"
    ) {
      return (
        <StatewideResults
          data={this.state.races.filter(
            a => getViewFromRace(a.office) == this.state.activeView
          )}
          state={this.props.state}
          view={this.state.activeView}
          ids={this.state.ids[this.state.activeView]}
        />
      );
    }
  }

  renderTabSwitcher() {
    // Create the tab switcher, between different race types
    const elements = this.state.activeRaces.flatMap((tab, i) => [
      this.createTabElement(tab),
    ]);

    return (
      <nav class="race-calendar">
        <ul>{elements}</ul>
      </nav>
    );
  }

  // TODO: use built in uppercase fxn here
  createTabElement(tab) {
    return (
      <li class={this.state.activeView === tab.toLowerCase() ? "active" : ""}>
        <a
          href={`./#/states/${this.props.state}/${tab.toLowerCase()}`}
          name="race-type-nav">
          {toTitleCase(tab)}
        </a>
      </li>
    );
  }

  switchResultsView(e) {
    const newTarget = e.target.dataset.hook;

    this.setState({
      activeView: newTarget,
    });

    // // When switching tabs, if the user is below the header then
    // // scroll back up to the top of the header. Otherwise, they're
    // // stuck in the middle of a results view.
    // TODO: replicate this
    // const headerHeight = document.getElementById('state-header').offsetHeight;
    // if (parentScrollAboveIframeTop < -headerHeight) {
    //   window.pymChild.scrollParentTo('state-results');
    // }

    // // The legend (shared from the big boards) is mostly irrelevant,
    // // except on the Key Results view
    // let unncessaryLegendItems = ['held', 'precincts', 'runoff'];
    // if (ballotInitiativesPresent) { unncessaryLegendItems = unncessaryLegendItems.concat(['yes', 'no']); }
    // if (STATES_WITH_POTENTIAL_RUNOFFS.includes(statepostal)) { unncessaryLegendItems = unncessaryLegendItems.concat('runoff'); }

    // if (resultsView === 'key') {
    //   unncessaryLegendItems.forEach(cls => { showLegendItem(cls, true); });
    // } else {
    //   unncessaryLegendItems.forEach(cls => { showLegendItem(cls, false); });
    // }

    // // Track both which tab is switched to, and what element linked to it
    // window.ANALYTICS.trackEvent('switch-state-tab', `${resultsView}-via-${e.target.getAttribute('name')}`);
  }
}
