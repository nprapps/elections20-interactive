// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { KeyResults } from "../keyResults";
import { HouseResults } from "../houseResults";
import { StatewideResults } from "../statewide";

var lastRequestTime;
var initialized = false;
var useDebug = false;
var isValidMarkup;

// TODO: check on the use of all of these
const STATES_WITHOUT_COUNTY_INFO = ["AK"];
const STATES_WITH_POTENTIAL_RUNOFFS = ["GA", "LA", "MS"];
const NEW_ENGLAND_STATES = ["ME", "NH", "VT", "MA", "CT", "RI"];

var viewMappings = {"P": "president", "S": "senate", "H": "house"}

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
    var raceIds = {}
    // TODO: add back in legend item suppression
    // TODO: handle special senate elections?
    Object.keys(json).forEach(function (item) {
      if (json[item].office != 'I') {
        var office = viewMappings[json[item].office];
        activeRaces.add(office)
        if (!raceIds[office]) {
          raceIds[office] = [];
        }
        raceIds[office].push(json[item].id)
      }
    });
    this.setState({ races: json, activeRaces: Array.from(activeRaces), ids: raceIds });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(this.getDataFileName("key"), this.onResultsData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(this.getDataFileName("key"), this.onResultsData);
  }

  componentDidUpdate(prevProps, prevState) {
    var { state, props } = this;
    var changed =
      prevState.activeView != state.activeView ||
      props.state != prevProps.state;
    console.log("DID", changed);
    if (changed) {
      this.updateWatchedFiles(prevState.activeView, this.state.activeView);
    }
  }

  render() {
    if (!this.props.state || !this.state.races) {
      return <div> "Loading..." </div>;
    } else if (false) {
      return <div></div>;
    }

    // TODO: Grab state name from a mapping or include it in json
    let stateName = this.state.races[0].state;

    let resultsType = `${this.state.activeView.toUpperCase()} Results`;
    return (
      <div class="results">
        <header id="state-header">
          <div class="state-icon">
            <i class={"stateface stateface-" + this.props.state}></i>
          </div>
          <h1>
            <img class="icon" src={"../../assets/states/" + this.props.state + ".svg"}></img>
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
          data = {this.state.races.filter(a => viewMappings[a.office] == this.state.activeView)}
          state={this.props.state}
          view={this.state.activeView}
          ids={this.state.ids[this.state.activeView]}
        />
      );
    }
    //else if (
    //   resultsView === 'senate' ||
    //   resultsView === 'senate special' ||
    //   resultsView === 'governor'
    // ) {
    //   resultsElements = [
    //     h('h2', 'Statewide Results'),
    //     renderRacewideTable(
    //       data.state,
    //       resultsView === 'senate'
    //         ? 'results-senate'
    //         : 'results-gubernatorial'
    //     )
    //   ];

    //   const stateResults = data.state
    //     .filter(c => !(c.first === '' && c.last === 'Other'));
    //   if (!STATES_WITHOUT_COUNTY_INFO.includes(stateResults[0].statepostal)) {
    //     // Render a county-level table below
    //     const sortKeys = sortCountyResults();
    //     const availableCandidates = stateResults.map(c => c.last);

    //     // Given constraints on Maquette, have to generate this `classes`
    //     // object here, and it cannot be assigned to `class`
    //     const tableClasses = { 'results-table': true };
    //     tableClasses[`candidates-${availableCandidates.length}`] = true;

    //     resultsElements = resultsElements.concat(
    //       h('div.results-counties', {
    //         classes: {
    //           'population': sortMetric['key'] === 'population',
    //           'past-results': sortMetric['key'] === 'past_margin',
    //           'unemployment': sortMetric['key'] === 'unemployment',
    //           'percent-white': sortMetric['key'] === 'percent_white',
    //           'percent-black': sortMetric['key'] === 'percent_black',
    //           'percent-hispanic': sortMetric['key'] === 'percent_hispanic',
    //           'median-income': sortMetric['key'] === 'median_income',
    //           'percent-college-educated': sortMetric['key'] === 'percent_bachelors'
    //         }
    //       }, [
    //         h('h2', 'Results By County'),
    //         h('ul.sorter', [
    //           h('li.label', 'Sort Counties By'),
    //           availableMetrics.map(metric => renderMetricLi(metric))
    //         ]),
    //         h('table', { classes: tableClasses }, [
    //           h('thead', [
    //             h('tr', [
    //               h('th.county', h('div', h('span', 'County'))),
    //               h('th.amt.precincts', h('div', h('span', ''))),
    //               availableCandidates.map(cand => renderCandidateTH(cand)),
    //               h('th.vote.margin', { key: 'margin' }, h('div', h('span', 'Vote margin'))),
    //               h('th.comparison', h('div', h('span', sortMetric['name'])))
    //             ])
    //           ]),
    //           sortKeys.map(key => renderCountyRow(data[key[0]], key[0], availableCandidates))
    //         ])
    //       ])
    //     );
    //   }
    // }

    // return h('div.results-elements', [resultsElements]);
  }

  updateWatchedFiles(prevView, currView) {
    const prevFile = this.getDataFileName(prevView);
    const newFile = this.getDataFileName(currView);
    gopher.unwatch(prevFile, this.onData);
    gopher.watch(newFile, this.onData);
  }

  getDataFileName(view) {
    var state = this.props.state;
    // TODO: should this be in this.state? It doesn't change so feels like no?
    return `/data/states/${state}.json`;
  }

  renderTabSwitcher() {
    // Create the tab switcher, between different race types

    const elements = this.state.activeRaces.flatMap((tab, i) => [
      this.createTabElement(tab)
    ]);

    return <nav class="race-calendar"><ul>{elements}</ul></nav>;
  }

  // TODO: use built in uppercase fxn here
  createTabElement(tab) {
    return (
      <li class={this.state.activeView === tab.toLowerCase() ? "active" : ""}>
      <a
        href={`./#/states/${this.props.state}/${tab.toLowerCase()}`}
        name="race-type-nav"
      >
        {tab[0].toUpperCase() + tab.slice(1)}
      </a>
      </li>
    );
  }

  // Move into statewide?
  sortCountyResults() {
    let values = [];

    for (let fipscode in extraData) {
      let sorter;
      if (sortMetric["census"]) {
        sorter = extraData[fipscode].census[sortMetric["key"]];
      } else {
        sorter = extraData[fipscode][sortMetric["key"]];
      }
      values.push([fipscode, sorter]);
    }

    values.sort(function (a, b) {
      if (sortMetric["key"] === "past_margin") {
        // always put Democratic wins on top
        if (a[1][0] === "D" && b[1][0] === "R") return -1;
        if (a[1][0] === "R" && b[1][0] === "D") return 1;

        const aMargin = parseInt(a[1].split("+")[1]);
        const bMargin = parseInt(b[1].split("+")[1]);

        // if Republican, sort in ascending order
        // if Democratic, sort in descending order
        if (a[1][0] === "R") {
          return aMargin - bMargin;
        } else {
          return bMargin - aMargin;
        }
      }

      return b[1] - a[1];
    });
    return values;
  }

  switchResultsView(e) {
    const newTarget = e.target.dataset.hook;

    this.setState({
      activeView: newTarget,
    });

    // // When switching tabs, if the user is below the header then
    // // scroll back up to the top of the header. Otherwise, they're
    // // stuck in the middle of a results view.
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

const createClassesForBoardCells = (result, coloredParties, uncontested) => {
  let classes = result.npr_winner ? "winner " : "";
  classes += result.party.toLowerCase();
  classes +=
    !coloredParties.includes(result.party) && result.party !== "Uncontested"
      ? " other"
      : "";
  classes += result.incumbent ? " incumbent" : "";
  classes += result.last.length > 8 ? " longname" : "";
  return classes;
};
