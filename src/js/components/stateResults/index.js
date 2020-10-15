// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import KeyRaces from "../stateViewKeyRaces";
import HouseResults from "../stateViewHouse";
import ResultsTableCandidates from "../resultsTableCandidates";
import CountyResults from "../countyResults";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import "./state-results.less";

import stateLookup from "states.sheet.json";
import strings from "strings.sheet.json";
import { getViewFromRace, formatters } from "../util.js";

// TODO: check on the use of all of these
const STATES_WITHOUT_COUNTY_INFO = ["AK"];
const STATES_WITH_POTENTIAL_RUNOFFS = ["GA", "LA", "MS"];

export default class StateResults extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.updateTimestamp(latest);
    this.setState({ races: data.results, test: data.test, latest });
  }

  updateTimestamp(timestamp, e) {
    var latest = Math.max(this.state.latest, timestamp);
    this.setState({ latest });
  }

  componentDidMount() {
    gopher.watch(`./data/states/${this.props.state}.json`, this.onData);
  }

  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
  }

  shouldComponentUpdate(newProps, newState) {
    if (this.props.state != newProps.state) {
      gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
      gopher.watch(`./data/states/${newProps.state}.json`, this.onData);
      this.setState({ races: null });
    }
  }

  render(props, state) {
    var { races, test, latest } = this.state;

    if (!races) {
      return <div> Loading... </div>;
    }

    let stateName = stateLookup[this.props.state].name;

    let office = props.subview || "key";
    let viewTitle =
      office == "key" ? "Key Results" : strings[`office-${office}`];

    return (
      <div
        class="state-results results"
        onupdatedtime={e => this.updateTimestamp(e.detail, e)}>
        <div class="content">
          <header id="state-header">
            <h1>
              <img
                class="icon"
                src={"./assets/states/" + this.props.state + ".svg"}></img>
              <span class="state-name">{stateName}</span>
              {viewTitle}
            </h1>
            {this.renderTabSwitcher(office)}
          </header>
          {test ? <TestBanner /> : ""}
          <div class="results-elements">{this.renderResults(office)}</div>
          Results as of <DateFormatter value={latest} />
        </div>

        <aside class="sidebar">
          <google-ad data-size="tall"></google-ad>
        </aside>  
      </div>
    );
  }

  renderResults(view) {
    if (view === "key") {
      return <KeyRaces state={this.props.state} />;
    } else if (view === "H" || view === "I") {
      var races = this.state.races.filter(r => r.office == view);
      return (
        <div class="results-house">
          <div class="results-wrapper">
            {races.map(race => (
              <ResultsTableCandidates data={race} class="house-race" />
            ))}
          </div>
        </div>
      );
    } else {
      var races = this.state.races.filter(r => r.office == view);
      return races.map(r => this.getRaceWithCountyResults(r));
    }
  }

  getRaceWithCountyResults(race) {
    var order = race.candidates;
    var isSpecial = !!race.seat;

    var countyResults;
    if (!STATES_WITHOUT_COUNTY_INFO.includes(this.props.state)) {
      countyResults = (
        <CountyResults
          state={this.props.state}
          raceid={race.id}
          order={order}
          isSpecial={isSpecial}
        />
      );
    }
    return (
      <>
        <ResultsTableCandidates data={race} />
        {countyResults}
      </>
    );
  }

  renderTabSwitcher(view) {
    // Create the tab switcher, between different race types
    var available = new Set(this.state.races.map(r => r.office));
    var tabs = "PGSHI"
      .split("")
      .filter(o => available.has(o))
      .map(function (data) {
        return {
          data,
          label: strings[`office-${data}`],
        };
      });

    tabs.unshift({
      data: "key",
      label: "Key Results",
    });

    var tabElements = tabs.map(t => (
      <li class={view == t.data ? "active" : "inactive"}>
        <a
          href={`#/states/${this.props.state}/${t.data}`}
          class="race-type-nav">
          {t.label}
        </a>
      </li>
    ));

    var dropdownElements = tabs.map(t => (
      <option
        value={`#/states/${this.props.state}/${t.data}`}
        selected={view == t.data ? "true" : ""}>
        {t.label}
      </option>
    ));

    return (
      <>
        <div class="mobile-calendar-wrapper">
          <div class="select-label">Select a contest</div>
          <div class="outer-mobile-calendar">
            <select class="mobile-calendar" onchange={this.handleSelect}>
              {dropdownElements}
            </select>
          </div>
        </div>
        <nav class="race-calendar">
          <ul>{tabElements}</ul>
        </nav>
      </>
    );
  }

  handleSelect(el) {
    window.location = el.target.value;
  }
}
