// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import KeyRaces from "../stateViewKeyRaces";
import ResultsTableCandidates from "../resultsTableCandidates";
import CountyResults from "../countyResults";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";

import stateLookup from "states.sheet.json";
import strings from "strings.sheet.json";
import { getViewFromRace, formatters } from "../util.js";

const STATES_WITHOUT_COUNTY_INFO = ["AK"];

export default class StateResults extends Component {
  constructor(props) {
    super();

    this.state = {
      data: {}
    };
    this.onData = this.onData.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.updateTimestamp(latest);
    this.setState({ data });
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
      this.setState({ data: {} });
      gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
      gopher.watch(`./data/states/${newProps.state}.json`, this.onData);
    }
  }

  render(props, state) {
    var { results, test, latest, chatter } = this.state.data;

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
          {test ? <TestBanner /> : ""}
          <header id="state-header">
            <h1 tabindex="-1">
              <img
                class="icon"
                src={"./assets/states/" + this.props.state + ".svg"}></img>
              {stateName}
            </h1>
            {this.renderTabSwitcher(office)}
            <div
              class="chatter"
              dangerouslySetInnerHTML={{ __html: chatter }}
            />
          </header>
          {results && (
            <div class="results-elements">{this.renderResults(office)}</div>
          )}
          <div class="source">
            {stateName !== "Alaska" && 
              <div class="note">Demographic trends not shown for special elections or states with fewer than 10 counties reporting above 50%.</div>
            }
            Source: AP (as of <DateFormatter value={latest} />
            ). Candidates receiving less than 3% support not shown individually. Demographic, income and education data from the Census Bureau. COVID-19 case data from{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19">
              Center for Systems Science and Engineering at Johns Hopkins
              University
            </a>
            . Unemployment rates from the Bureau of Labor Statistics. 2016
            presidential margins from the AP and may vary slightly from
            state-certified final results.
          </div>
        </div>

        <aside class="sidebar">
          <google-ad data-size="tall"></google-ad>
        </aside>
      </div>
    );
  }

  renderResults(view) {
    var numberSort = (a, b) => a.seatNumber * 1 - b.seatNumber * 1;
    var nameSort = (a, b) => (a.seat < b.seat ? -1 : 1);
    if (view === "key") {
      return <KeyRaces state={this.props.state} />;
    } else if (view === "H" || view === "I") {
      var results = this.state.data.results
        .filter(r => r.office == view)
        .sort(view === "I" ? nameSort : numberSort);
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
      var results = this.state.data.results.filter(r => r.office == view);
      return (
        <div>
          {results.length > 1 && this.renderJumpButtons(results)}
          {results.map(r =>
            this.getRaceWithCountyResults(r, results.length - 1)
          )}
        </div>
      );
    }
  }

  renderJumpButtons(results) {
    return (
      <nav class="jump-links">
        Jump to results:
        {results.map((r, i) => (
          <>
            <a onClick={() => this.jump(`#race-${r.id}`)}>
              {`${stateLookup[this.props.state].name} ${r.seatNumber || 1}`}
            </a>{" "}
            <span class="pipe">{i < results.length - 1 ? "|" : ""}</span>
          </>
        ))}
      </nav>
    );
  }

  jump(id) {
    var element = document.querySelector(id);
    if (element) {
      element.focus();
      element.scrollIntoView();
    }
  }

  getRaceWithCountyResults(race, oneOfMultiple) {
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

    var specialHeader = oneOfMultiple ? (
      <h2 id={`${this.props.state}-${seatLabel || 1}`}>{`${
        stateLookup[this.props.state].name
      } ${seatLabel || 1}`}</h2>
    ) : (
      ""
    );
    return (
      <div id={`race-${race.id}`} class="race" tabindex="-1">
        {specialHeader}
        <ResultsTableCandidates data={race} />
        {countyResults}
      </div>
    );
  }

  renderTabSwitcher(view) {
    // Create the tab switcher, between different race types
    var { results } = this.state.data;
    if (!results) return false;
    var available = new Set(results.map(r => r.office));
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
      <li class={`sortButton ${view == t.data ? "selected" : ""}`}>
        <span class="metric">
          <a
            aria-current={view == t.data}
            href={`#/states/${this.props.state}/${t.data}`}
            class="race-type-nav">
            {t.label}
          </a>
        </span>
        <span class="pipe"> | </span>
      </li>
    ));

    return (
      <>
        <ul class="sorter">
          <li class="label">Election results:</li>
          {tabElements}
        </ul>
      </>
    );
  }

  handleSelect(el) {
    window.location = el.target.value;
  }
}
