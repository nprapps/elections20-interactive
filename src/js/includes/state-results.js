// Polyfills that aren't covered by `babel-preset-env`

// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed, toTitleCase } from './helpers.js';
import gopher from '../gopher.js';
import getValues from 'lodash.values';
import sortBy from 'lodash.sortby';
import { KeyResults } from './KeyResults.js';

var lastRequestTime;
var initialized = false;
var useDebug = false;
var isValidMarkup;

const STATES_WITHOUT_COUNTY_INFO = ['AK'];
const STATES_WITH_POTENTIAL_RUNOFFS = ['GA', 'LA', 'MS'];
const NEW_ENGLAND_STATES = ['ME', 'NH', 'VT', 'MA', 'CT', 'RI'];

export class StateResults extends Component {
  constructor(props) {
    super();

    console.log(props.activeView)
    this.state = {
      activeView: props.activeView,
    };
    this.onData = this.onData.bind(this);
    this.switchResultsView = this.switchResultsView.bind(this);
  }

  onData(json) {
    this.setState(json);
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(this.getDataFileName('main'), this.onData);
    gopher.watch(this.getDataFileName('key'), this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(this.getDataFileName('main'), this.onData);
    gopher.unwatch(this.getDataFileName('key'), this.onData);
  }

  componentDidUpdate(prevProps, prevState) {
    var { state, props } = this;
    var changed =
      prevState.activeView != state.activeView ||
      props.state != prevProps.state;
    console.log('DID', changed);
    if (changed) {
      this.updateWatchedFiles(prevState.activeView, this.state.activeView);
    }
  }

  render() {
    if (!this.props.state || !this.state.results) {
      return <div> "Loading..." </div>;
    } else if (false) {
      return <div></div>;
    }

    // TODO: Use this to set a more permanent state name? Make a code to name mapping
    const anyHouseRaceID = Object.keys(this.state.results.house.results)[0];
    const anyHouseCandidate = this.state.results.house.results[
      anyHouseRaceID
    ][0];
    let stateName = anyHouseCandidate.statename;

    let resultsType = `${this.state.activeView.toUpperCase()} Results`;

    return (
      <div class="results">
        <header id="state-header">
          <div class="state-icon">
            <i class={'stateface stateface-' + this.props.state}></i>
          </div>
          <h1>
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
    let data = this.state.results;

    if (this.state.activeView === 'key') {
      return <KeyResults state={this.props.state.toLowerCase()} />;
    } else if (this.state.activeView === 'house') {
      const sortedHouseKeys = Object.keys(data['house']['results']).sort(
        function (a, b) {
          return (
            data['house']['results'][a][0]['seatnum'] -
            data['house']['results'][b][0]['seatnum']
          );
        }
      );

      return (
        <div class="results-house">
          <div class="results-wrapper">
            {sortedHouseKeys.map(race =>
              this.renderRacewideTable(
                data['house']['results'][race],
                'house-race'
              )
            )}
          </div>
        </div>
      );

      // resultsElements = h('div.results-house', {
      //   classes: {
      //     'one-result': Object.keys(data['house']['results']).length === 1,
      //     'two-results': Object.keys(data['house']['results']).length === 2,
      //     'three-results': Object.keys(data['house']['results']).length === 3,
      //     'four-results': Object.keys(data['house']['results']).length === 4
      //   }
      // }, [
      //   h('div.results-wrapper', [
      //     sortedHouseKeys.map(race => renderRacewideTable(data['house']['results'][race], 'house-race'))
      //   ])
      // ]);
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

  renderRacewideTable(results, tableClass) {
    if (results.length === 1) {
      return renderUncontestedRace(results[0], tableClass);
    }

    const seatName =
      results[0].officename === 'U.S. House' ? results[0].seatname : null;
    let totalVotes = 0;
    for (let i = 0; i < results.length; i++) {
      totalVotes += results[i].votecount;
    }

    if (results.length > 2) {
      results = this.sortResults(results);
    }

    // TODO add in fmtComma to total votes
    return (
      <div class={tableClass}>
        <table class="results-table">
          {seatName ? <caption> {seatName}</caption> : ''}
          <colgroup>
            <col class="seat-status"></col>
            <col class="candidate"></col>
            <col class="amt"></col>
            <col class="amt"></col>
          </colgroup>
          <thead>
            <tr>
              <th class="seat-info" scope="col"></th>
              <th class="candidate" scope="col">
                Candidate
              </th>
              <th class="amt" scope="col">
                Votes
              </th>
              <th class="amt" scope="col">
                Percent
              </th>
            </tr>
          </thead>
          <tbody>{results.map(result => this.renderRow(result))}</tbody>
          <tfoot>
            <tr>
              <td class="seat-status"></td>
              <th class="candidate" scope="row">
                Total
              </th>
              <td class="amt">{totalVotes}</td>
              <td class="amt">%100</td>
            </tr>
          </tfoot>
        </table>
        <p class="precincts">
          {this.calculatePrecinctsReporting(
            results[0]['precinctsreportingpct']
          ) +
            '% of precincts reporting (' +
            results[0].precinctsreporting +
            ' of ' +
            results[0].precinctstotal +
            ')'}
        </p>
      </div>
    );
  }

  renderRow(result) {
    // TODO add classes back in
    return (
      <tr>
        <td class="seat-status">
          {result.pickup ? <span class="pickup"></span> : ''}
        </td>
        {this.renderCandidateName(result)}
        <td class="amt">{result.votecount}</td>
        <td class="amt">{(result.votepct * 100).toFixed(1)}%</td>
      </tr>
    );
  }

  renderCandidateName(result) {
    // Handle `Other` candidates, which won't have a `party` property
    const party = result.party ? ` (${result.party})` : '';

    return (
      <td class="candidate" scope="col">
        <span class="fname">{result.first} </span>
        <span class="lname">{result.last}</span>
        {party}
        {result.npr_winner ? <i class="icon icon-ok"></i> : ''}
      </td>
    );
  }

  sortResults(results) {
    results.sort(function (a, b) {
      if (a.last === 'Other') return 1;
      if (b.last === 'Other') return -1;
      if (a.votecount > 0 || a.precinctsreporting > 0) {
        return b.votecount - a.votecount;
      } else {
        if (a.last < b.last) return -1;
        if (a.last > b.last) return 1;
        return 0;
      }
    });
    return results;
  }

  updateWatchedFiles(prevView, currView) {
    const prevFile = this.getDataFileName(prevView);
    const newFile = this.getDataFileName(currView);
    gopher.unwatch(prevFile, this.onData);
    gopher.watch(newFile, this.onData);
  }

  getDataFileName(view) {
    var state = this.props.state.toLowerCase();
    // TODO: should this be in this.state? It doesn't change so feels like no?
    if (view === 'senate' || view === 'governor') {
      return `https://apps.npr.org/elections18-graphics/data/${state}-counties-${view}.json`;
    } else if (view === 'senate special') {
      return `https://apps.npr.org/elections18-graphics/data/${state}-counties-senate-special.json`;
    } else if (view === 'main') {
      return (
        'https://apps.npr.org/elections18-graphics/data/extra_data/' +
        state +
        '-extra.json'
      );
    } else {
      return `https://apps.npr.org/elections18-graphics/data/${state}.json`;
    }
  }

  renderTabSwitcher() {
    // Create the tab switcher, between different race types
    // For styling on the page, these links will be split by a delimiter
    const DELIMITER = '|';

    // TODO: make this real
    const elements = ['key', 'house', 'governor'].flatMap((tab, i) => [
      this.createTabElement(tab),
      DELIMITER,
    ]);
    // remove the trailing delimiter
    elements.pop();

    return <div class="switcher">Election results: {elements}</div>;
  }

  // TODO: use built in uppercase fxn here
  createTabElement(tab) {
    return (
      <a
        href={`./#/states/${this.props.state}/${tab.toLowerCase()}`}
        name="race-type-nav"
        class={this.state.activeView === tab.toLowerCase() ? 'active' : ''}
      >
        {tab[0].toUpperCase() + tab.slice(1)}
      </a>
    );
  }

  sortCountyResults() {
    let values = [];

    for (let fipscode in extraData) {
      let sorter;
      if (sortMetric['census']) {
        sorter = extraData[fipscode].census[sortMetric['key']];
      } else {
        sorter = extraData[fipscode][sortMetric['key']];
      }
      values.push([fipscode, sorter]);
    }

    values.sort(function (a, b) {
      if (sortMetric['key'] === 'past_margin') {
        // always put Democratic wins on top
        if (a[1][0] === 'D' && b[1][0] === 'R') return -1;
        if (a[1][0] === 'R' && b[1][0] === 'D') return 1;

        const aMargin = parseInt(a[1].split('+')[1]);
        const bMargin = parseInt(b[1].split('+')[1]);

        // if Republican, sort in ascending order
        // if Democratic, sort in descending order
        if (a[1][0] === 'R') {
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

  calculatePrecinctsReporting(pct) {
    if (pct > 0 && pct < 0.005) {
      return '<1';
    } else if (pct > 0.995 && pct < 1) {
      return '>99';
    } else {
      return Math.round(pct * 100);
    }
  }

  decideLabel(race) {
    if (race['officename'] === 'U.S. House') {
      return race['statepostal'] + '-' + race['seatnum'];
    } else if (
      race['officename'] === 'President' &&
      race['level'] === 'district' &&
      race['reportingunitname'] !== 'At Large'
    ) {
      return race['statepostal'] + '-' + race['reportingunitname'].slice('-1');
    } else if (race['is_ballot_measure']) {
      // The AP provides ballot measure names in inconsistent formats
      const splitName = race.seatname.split(' - ');
      const isHyphenatedMeasureName = Boolean(
        race.seatname.match(/^[A-Z\d]+-[A-Z\d]+ /)
      );

      if (splitName.length === 1 && !isHyphenatedMeasureName) {
        // Sometimes there's no identifier, such as: 'Legislative Pay'
        return `${race.statepostal}: ${race.seatname}`;
      } else if (splitName.length === 1 && isHyphenatedMeasureName) {
        // Sometimes there's a compound identifier, such as '18-1 Legalize Marijuana'
        const [number, ...identifierParts] = race.seatname.split(' ');
        const identifier = identifierParts.join(' ');
        return `${race.statepostal}-${number}: ${identifier}`;
      } else if (splitName.length === 2) {
        // Usually, there's an identifier with a ` - ` delimiter, eg:
        // 'S - Crime Victim Rights'
        // '1464 - Campaign Finance'
        return `${race.statepostal}-${splitName[0]}: ${splitName[1]}`;
      } else {
        console.error('Cannot properly parse the ballot measure name');
        return `${race.statepostal} - ${race.seatname}`;
      }
    } else {
      return race['statepostal'];
    }
  }
}

const createClassesForBoardCells = (result, coloredParties, uncontested) => {
  let classes = result.npr_winner ? 'winner ' : '';
  classes += result.party.toLowerCase();
  classes +=
    !coloredParties.includes(result.party) && result.party !== 'Uncontested'
      ? ' other'
      : '';
  classes += result.incumbent ? ' incumbent' : '';
  classes += result.last.length > 8 ? ' longname' : '';
  return classes;
};
