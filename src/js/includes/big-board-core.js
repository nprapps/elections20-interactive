// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from '../gopher.js';

var copyBop = window.copy.bop;

export class BigBoardCore extends Component {
  constructor(props) {
    super();

    this.state = { json: props.json, title: props.title };
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState(json);
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/${this.state.json}`,
      this.onData
    );
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/top-level-results.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/${this.state.json}`,
      this.onData
    );
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/top-level-results.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.results || !this.state.house_bop) {
      return <div> "Loading..." </div>;
    } else if (false) {
      // TODO: replace this with a check for valid formatting?
      return <div></div>;
    }
    const results = this.getCleanedResults(this.state.results);

    // TODO: add in last updated to footer and senate footnote
    return (
      <div class="results-wrapper">
        <div class="results-header">
          <h1> {this.state.title} </h1>
          {this.renderTopLevel()}
        </div>
        <div class="results">
          <div class="column first">
            {results.firstCol.map(res => this.renderResultsTable(res))}
          </div>
          <div class="column second">
            {results.secondCol.map(res => this.renderResultsTable(res))}
          </div>
        </div>
        <div class="footer">
          <p>
            {' '}
            Source: AP <span>as of lastupdated ET</span>
          </p>
        </div>
      </div>
    );
  }

  renderResultsTable(column) {
    var races = column.races;

    if (races) {
      return (
        <Fragment>
          <h2 class="bucketed-group">
            <span>
              {isBucketedByTime(column['category'])
                ? column['category'] + ' ET'
                : column['category']}
              {column.overflow ? ' (continued) ' : ''}
            </span>
          </h2>
          <table class="races">
            <thead class="screen-reader-only">
              <tr>
                <th scope="col" class="pickup">
                  Pick-up?
                </th>
                <th scope="col" class="state">
                  Name
                </th>
                <th scope="col" class="candidate">
                  Candidate one name
                </th>
                <th scope="col" class="candidate-total">
                  Candidate one vote percent
                </th>
                <th scope="col" class="candidate-total-spacer"></th>
                <th scope="col" class="candidate-total">
                  Candidate two vote percent
                </th>
                <th scope="col" class="candidates">
                  Candidate two name
                </th>
                <th scope="col" class="results-status">
                  Percent of precincts reporting
                </th>
              </tr>
            </thead>
            {races.map(race => this.renderRace(race))}
          </table>
        </Fragment>
      );
    } else {
      return <div></div>;
    }
  }

  renderRace(race) {
    var result1 = race['results']['result1'];
    var result2 = race['results']['result2'];
    var winningResult = race['results']['winningResult'];
    var results = race['results'];
    var coloredParties = ['Dem', 'GOP', 'Yes', 'No'];

    // Create the first and second candidate cells.
    var firstCandClasses = createClassesForBoardCells(result1, coloredParties);
    var firstCand = (
      <Fragment>
        <td class="pickup"></td>
        <th class="state">{race['label']}</th>
        <td class={'candidate ' + firstCandClasses}>
          <span class="fname">
            {' '}
            {result1['first'] ? result1['first'] + ' ' : ''}
          </span>
          <span class="lname">
            {results['uncontested']
              ? result1['last'] + ' (Uncontested)'
              : result1['last']}
          </span>
        </td>
        <td class={'candidate-total ' + firstCandClasses}>
          {results['uncontested'] ? (
            ''
          ) : (
            <span class="candidate-total-wrapper">
              {Math.round(result1['votepct'] * 100)}
            </span>
          )}
        </td>
      </Fragment>
    );

    var secondCandClasses = results['uncontested']
      ? ''
      : createClassesForBoardCells(result2, coloredParties);
    var secondCand = results['uncontested'] ? (
      <div></div>
    ) : (
      <Fragment>
        <td class="candidate-total-spacer"></td>
        <td class={'candidate-total ' + secondCandClasses}>
          {results['uncontested'] ? (
            ''
          ) : (
            <span class="candidate-total-wrapper">
              {Math.round(result2['votepct'] * 100)}
            </span>
          )}
        </td>
        <td class={'candidate ' + secondCandClasses}>
          <span class="fname">
            {' '}
            {result2['first'] ? result2['first'] + ' ' : ''}
          </span>
          <span class="lname">{result2['last']}</span>
        </td>
        <td class="results-status">
          {!results['uncontested']
            ? this.calculatePrecinctsReporting(result1['precinctsreportingpct'])
            : ''}
        </td>
      </Fragment>
    );

    return (
      <tr>
        {firstCand}
        {secondCand}
      </tr>
    );
  }

  renderTopLevel() {
    if (this.state.title.match(/^House/)) {
      var bop = this.state.house_bop;
      return this.renderCongressBOP(bop);
    } else if (this.state.title.indexOf('Senate') !== -1) {
      var bop = this.state.senate_bop;
      return this.renderCongressBOP(bop);
    }
    // else if (this.state.title.indexOf('President') !== -1) {
    //     var bop = bopData['electoral_college'];
    //     return renderElectoralBOP(bop);
    // }
    else {
      return <div class="leaderboard"></div>;
    }
  }

  renderCongressBOP(bop, chamber) {
    // TODO: refactor this to make cleaner
    const demSeats = bop['Dem']['seats'];
    const gopSeats = bop['GOP']['seats'];
    const indSeats = bop['Other']['seats'];

    var netGain = 0;
    var netGainParty = 'no-change';
    var netGainPartyLabel = 'No change';
    var netGainTitle = '';
    var netGainExplanation = copyBop['pickups_' + chamber];

    if (bop['Dem']['pickups'] > 0) {
      netGain = bop['Dem']['pickups'];
      netGainParty = 'dem';
      netGainPartyLabel = 'Dem.';
      netGainTitle = copyBop['pickups_' + netGainParty];
      netGainTitle = netGainTitle.replace('___PICKUPS___', netGain);
    } else if (bop['GOP']['pickups'] > 0) {
      netGain = bop['GOP']['pickups'];
      netGainParty = 'gop';
      netGainPartyLabel = 'GOP';
      netGainTitle = copyBop['pickups_' + netGainParty];
      netGainTitle = netGainTitle.replace('___PICKUPS___', netGain);
    }

    const chamberWinner = bop['npr_winner'];
    const uncalledRaces = bop['uncalled_races'];

    return (
      <div class="leaderboard">
        <div class="results-header-group net-gain">
          <h2 class={'party ' + netGainParty} title={netGainTitle}>
            <label>{copyBop['pickups_gain']}</label>
            <abbr title={netGainTitle}>
              {netGain > 0 ? netGainPartyLabel + '+' + netGain : netGain}
            </abbr>
          </h2>
        </div>
        {this.getTopLevelHeaderGroup('Dem.', 'Dem', demSeats)}
        {this.getTopLevelHeaderGroup('GOP.', 'GOP', gopSeats)}
        {this.getTopLevelHeaderGroup('Ind.', 'Other', indSeats)}
        {this.getTopLevelHeaderGroup(
          'Not Yet Called',
          'Not-Called',
          uncalledRaces
        )}
      </div>
    );
  }

  getTopLevelHeaderGroup(label, party, data, winner) {
    return (
      <div class={'results-header-group ' + party.toLowerCase()}>
        <h2 class="party">
          <label>
            {winner === party ? <i class="icon.icon-ok"></i> : ''}
            {label}
          </label>
          <abbr>{data}</abbr>
        </h2>
      </div>
    );
  }

  getCleanedResults(resultsData) {
    // Get our data into a clean final format
    var numRaces = 0;
    let sortedCategories = [];

    // Sort results and extract the two races to display.
    for (let bucket in resultsData) {
      let sortedRaces = [];
      for (let races in resultsData[bucket]) {
        numRaces += 1;
        var raceLabel = this.decideLabel(resultsData[bucket][races][0]);
        var raceResults = this.determineResults(resultsData[bucket][races]);
        var metadata = this.getMetaData(raceResults);
        Object.assign(raceResults, metadata);

        var race = { label: raceLabel, results: raceResults };

        sortedRaces.push(race);
      }
      sortedRaces = sortedRaces.sort((a, b) => (a.label > b.label ? 1 : -1));
      sortedCategories.push({ category: bucket, races: sortedRaces });
    }
    sortedCategories = this.sortBuckets(sortedCategories);

    // Make two roughly equal length columns from the results.
    const breakingIndex = Math.ceil(numRaces / 2);
    let raceIndex = 0;

    for (let i = 0; i < sortedCategories.length; i++) {
      raceIndex += sortedCategories[i].races.length;
      if (raceIndex >= breakingIndex) {
        if (raceIndex > breakingIndex) {
          var leftover = raceIndex - breakingIndex;
          var keep = sortedCategories[i].races.length - leftover;
          var carryOverCategory = JSON.parse(
            JSON.stringify(sortedCategories[i])
          );
          carryOverCategory.races = carryOverCategory.races.slice(
            keep,
            sortedCategories[i].races.length + 1
          );
          carryOverCategory.overflow = true;
          sortedCategories.splice(i + 1, 0, carryOverCategory);
          sortedCategories[i].races = sortedCategories[i].races.slice(
            0,
            keep - 1
          );
        }
        return {
          firstCol: sortedCategories.slice(0, i + 1),
          secondCol: sortedCategories.slice(i + 1, sortedCategories.length + 1),
        };
      }
    }

    return sortedCategories;
  }

  getMetaData(results) {
    const result1 = results.result1;
    const result2 = results.result2;

    let winningResult;
    if (result1['npr_winner'] || results.uncontested) {
      winningResult = result1;
    } else if (result2['npr_winner']) {
      winningResult = result2;
    }

    if (winningResult) {
      var called = true;
    }

    if (
      winningResult &&
      result1['meta']['current_party'] &&
      winningResult['party'] !== result1['meta']['current_party']
    ) {
      var change = true;
    }

    if (
      called ||
      result1['votecount'] > 0 ||
      (!results.uncontested && result2['votecount'] > 0)
    ) {
      var reporting = true;
    }

    return { winningResult, called, reporting, change };
  }

  sortBuckets(buckets) {
    return isBucketedByTime(buckets[0].category)
      ? buckets.sort(function (a, b) {
          var aHour = parseInt(a.category.split(':')[0]);
          var bHour = parseInt(b.category.split(':')[0]);

          if (a.category.slice(-4) === 'a.m.') return 1;
          if (b.category.slice(-4) === 'a.m.') return -1;
          if (aHour === bHour && a.category.indexOf('30') !== -1) return 1;
          if (aHour === bHour && b.category.indexOf('30') !== -1) return -1;
          else return aHour - bHour;
        })
      : buckets.sort((a, b) => (a.category > b.category ? 1 : -1));
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

  determineResults(race) {
    if (race.length === 1) {
      return { result1: race[0], uncontested: true };
    }

    let result1;
    let result2;
    // TODO: check switching away from loopArr didn't break anything

    for (var i = 0; i < race.length; i++) {
      var result = race[i];
      if (
        (result['party'] === 'Dem' || result['party'] === 'Yes') &&
        !result1
      ) {
        result1 = result;
      } else if (
        (result['party'] === 'GOP' || result['party'] === 'No') &&
        !result2
      ) {
        result2 = result;
      }

      if (result1 && result2) {
        break;
      }
    }

    // Handle when there're two candidates of one party, and
    // ensure that the same candidate isn't used twice
    if (!result1) {
      result1 = race.filter(r => !areCandidatesSame(r, result2))[0];
    } else if (!result2) {
      result2 = race.filter(r => !areCandidatesSame(r, result1))[0];
    }

    let sortedResults = [result1, result2];

    // If both candidates are GOP, put the leader on the right side
    // Otherwise, put the leader on the left side.
    if (result1.party === result2.party) {
      sortedResults = sortedResults.sort(function (a, b) {
        return sortedResults[0].party === 'GOP'
          ? a['votepct'] - b['votepct']
          : b['votepct'] - a['votepct'];
      });
    }

    return { result1: sortedResults[0], result2: sortedResults[1] };
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

// Helper functions
const areCandidatesSame = (c1, c2) =>
  c1.first === c2.first && c1.last === c2.last && c1.party === c2.party;

// TODO: make this a regex
const isBucketedByTime = bucket =>
  bucket.includes(':') && (bucket.includes('a.m.') || bucket.includes('p.m.'));
