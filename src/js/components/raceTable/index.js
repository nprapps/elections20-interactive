import { h, Component, Fragment } from 'preact';
import gopher from '../gopher.js';

export class RaceTable extends Component {
  constructor(props) {
    super();

    this.state = { races: props.races};
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    return <table class="races">
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
        {this.state.races.map(race => this.renderRace(race))}
      </table>
  }

  renderRace(race) {
    var result1 = race['results']['result1'];
    var result2 = race['results']['result2'];
    var winningResult = race['results']['winningResult'];
    var results = race['results'];
    var coloredParties = ['Dem', 'GOP', 'Yes', 'No'];

    // Create the first and second candidate cells.
    var firstCandClasses = this.createClassesForBoardCells(result1, coloredParties);
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
      : this.createClassesForBoardCells(result2, coloredParties);
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

  createClassesForBoardCells(result, coloredParties, uncontested) {
    let classes = result.npr_winner ? 'winner ' : '';
    classes += result.party.toLowerCase();
    classes +=
      !coloredParties.includes(result.party) && result.party !== 'Uncontested'
        ? ' other'
        : '';
    classes += result.incumbent ? ' incumbent' : '';
    classes += result.last.length > 8 ? ' longname' : '';
    return classes;
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