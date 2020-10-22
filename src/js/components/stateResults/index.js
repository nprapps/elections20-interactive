// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import KeyRaces from "../stateViewKeyRaces";
import ResultsTableCandidates from "../resultsTableCandidates";
import CountyResults from "../countyResults";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
// import "./state-results.less";

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
    this.setState(data);
  }

  updateTimestamp(timestamp, e) {
    var latest = Math.max(this.state.latest || 0, timestamp);
    this.setState({ latest });
  }

  componentDidMount() {
    gopher.watch(`./data/states/${this.props.state}.json`, this.onData);
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
  }

  shouldComponentUpdate(newProps, newState) {
    if (this.props.state != newProps.state) {
      this.setState({ results: null });
      gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
      gopher.watch(`./data/states/${newProps.state}.json`, this.onData);
    }
  }

  render(props, state) {
    var { results, test, latest, chatter } = this.state;

    let stateName = stateLookup[this.props.state].name;

    let office = props.subview || "key";
    let viewTitle =
      office == "key"
        ? "Key Results"
        : `${strings[`office-${office}`]} Results`;

    return (
      <div
        class="state-results results"
        onupdatedtime={e => this.updateTimestamp(e.detail, e)}>
        <div class="content">
          <header id="state-header">
            <h1 tabindex="-1">
              <img
                class="icon"
                src={"./assets/states/" + this.props.state + ".svg"}></img>
              <span class="state-name">{stateName}</span>
              {viewTitle}
            </h1>
            <div
              class="chatter"
              dangerouslySetInnerHTML={{ __html: chatter }}
            />
            {this.renderTabSwitcher(office)}
          </header>
          {test ? <TestBanner /> : ""}
          {results && (
            <div class="results-elements">{this.renderResults(office)}</div>
          )}
          <div class="source">
            Source: AP (as of <DateFormatter value={latest} />)
          </div>
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
      var results = this.state.results.filter(r => r.office == view);
      return (
        <div class="results-no-counties">
          <div class="results-wrapper">
            {results.map(race => (
              <ResultsTableCandidates data={race} class="house-race" />
            ))}
          </div>
        </div>
      );
    } else {
      var results = this.state.results.filter(r => r.office == view);
      return results.map(r => this.getRaceWithCountyResults(r));
    }
  }

  getRaceWithCountyResults(race) {
    var order = race.candidates;
    var isSpecial = !!race.seat;

    var seatLabel =
      race.office == "H" || race.office == "S" ? race.seatNumber : "";

    var countyResults;
    if (!STATES_WITHOUT_COUNTY_INFO.includes(this.props.state)) {
      countyResults = (
        <CountyResults
          state={this.props.state}
          raceid={race.id}
          order={order}
          isSpecial={isSpecial}
          key={race.id}
        />
      );
    }

    var specialHeader = isSpecial ? (
      <h2 id={`${this.props.state}-${seatLabel}`}>{`${
        stateLookup[this.props.state].name
      }-${seatLabel}`}</h2>
    ) : (
      ""
    );
    return (
      <>
        {specialHeader}
        <ResultsTableCandidates data={race} />
        {countyResults}
      </>
    );
  }

  renderTabSwitcher(view) {
    // Create the tab switcher, between different race types
    if (!this.state.results) return false;
    var available = new Set(this.state.results.map(r => r.office));
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
      label: "Key",
    });

    var tabElements = tabs.map(t => (
      <div>
        <a
          aria-current={view == t.data}
          href={`#/states/${this.props.state}/${t.data}`}
          class="race-type-nav">
          {t.label}
        </a>
      </div>
    ));

    return (
      <>
        <nav class="race-calendar">
          <div>
            <span class="view-label">Election results: </span>
          </div>
          {tabElements}
        </nav>
      </>
    );
  }

  handleSelect(el) {
    window.location = el.target.value;
  }
}
