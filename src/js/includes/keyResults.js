import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from '../gopher.js';
import { determineResults, decideLabel, getMetaData } from './util.js';
import { RaceTable } from './raceTable.js';

export class KeyResults extends Component {
  constructor(props) {
    super();

    this.showHousesIfMoreThanN = 10;
    this.statesWithoutCountyInfo = ['AK']; // Get me passed in
    this.state = { };
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    const allRaces = []
      .concat(Object.values(json.results.house.results))
      .concat(Object.values(json.results.senate.results))
      .concat(Object.values(json.results.governor.results))
      .concat(Object.values(json.results.ballot_measures.results));

    // Poll-close time is set at a statewide level, can be extracted from any race
    const pollCloseTime = allRaces[0][0].meta.poll_closing;
    const areThereAnyVotesYet = allRaces.some(race =>
      race.some(result => result.votecount > 0 || result.npr_winner)
    );
    // TODO: Move me into calling classes
    const showCountyResults = !this.statesWithoutCountyInfo.includes(
      allRaces[0][0].statepostal
    );

    this.setState({
      races: json,
      pollCloseTime,
      areThereAnyVotesYet,
      showCountyResults,
    });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.state}.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.state}.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.races) {
      return '';
    }

    const data = this.state.races.results;
    const houseResults = Object.values(data.house.results);
    const keyHouseResults = houseResults.filter(race => race[0].meta.key_race);

    // TODO: add these back in
    // {Object.keys(data.senate.results).length ? this.renderMiniBigBoard('Senate', 'senate', data.senate.results.filter(r => !r[0].is_special_election), 'senate', showCountyResults ? 'County-level results \u203a' : 'Detailed Senate results \u203a') : ''}
    // {Object.keys(data.senate.results).length ? this.renderMiniBigBoard('Senate Special', 'senate senate-special', data.senate.results.filter(r => r[0].is_special_election), 'senate special', showCountyResults ? 'County-level results \u203a' : 'Detailed Senate Special results \u203a') : ''}

    return (
      <div>
        {this.state.areThereAnyVotesYet ? (
          ''
        ) : (
          <p class="poll-closing">{`Last polls close at ${this.state.pollCloseTime} ET.`}</p>
        )}
        {this.renderMiniBigBoard(
          'Governor',
          'governor',
          data.governor.results,
          'governor',
          this.state.showCountyResults
            ? 'County-level results \u203a'
            : 'Detailed gubernatorial results \u203a'
        )}
        {keyHouseResults.length &&
        Object.keys(data.house.results).length > this.showHousesIfMoreThanN
          ? this.renderMiniBigBoard(
              'Key House Races',
              'house',
              keyHouseResults.sort(
                (a, b) => parseInt(a[0].seatnum) - parseInt(b[0].seatnum)
              ),
              'house',
              'All House results \u203a'
            )
          : this.renderMiniBigBoard(
              'House Races',
              'house',
              houseResults.sort(
                (a, b) => parseInt(a[0].seatnum) - parseInt(b[0].seatnum)
              ),
              'house',
              'Detailed House results \u203a'
            )}
        {this.renderMiniBigBoard(
          'Key Ballot Initiatives',
          'ballot-measures',
          Object.values(data.ballot_measures.results).sort(
            (a, b) =>
              a[0].seatname.split(' - ')[0] - b[0].seatname.split(' - ')[0]
          )
        )}
      </div>
    );
  }

  renderMiniBigBoard(title, boardClass, races, linkRaceType, linkText) {
    if (!Object.keys(races).length) {
      return '';
    }
    // TODO: get this functional again.
    //onclick={this.switchResultsView.bind(this)}*/}
    const cleanedRaces = this.getCleanedResults(races);
    return (
      <div class={'board ' + this.getBoardClasses(boardClass, races)}>
        <h2>
          {title}
          {linkRaceType ? (
            <a href={`./#/states/${this.props.state}/${boardClass}`}>
              {linkText}
            </a>
          ) : (
            <span></span>
          )}
        </h2>
        <div class="results-wrapper">
          <div class="results">
            <div class="column">
              <RaceTable races={cleanedRaces} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  getBoardClasses(boardClass, races) {
    var c = [boardClass];
    if (races.length === 0) {
      c.push('hidden');
    }
    return c.join(' ');
  }

  getCleanedResults(resultsData) {
    // Get our data into a clean final format
    let sortedRaces = [];
    // Sort results and extract the two races to display.
    for (let bucket in resultsData) {
      var raceLabel = decideLabel(resultsData[bucket][0]);
      var raceResults = determineResults(resultsData[bucket]);
      console.log('race results', raceResults);
      var metadata = getMetaData(raceResults);
      Object.assign(raceResults, metadata);

      var race = { label: raceLabel, results: raceResults };

      sortedRaces.push(race);
    }
    sortedRaces = sortedRaces.sort((a, b) => (a.label > b.label ? 1 : -1));
    return sortedRaces;
  }
}
