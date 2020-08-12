import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from '../gopher.js';
import { calculatePrecinctsReporting } from './util.js';

export class RacewideTable extends Component {
  constructor(props) {
    super();

    console.log(props)
    this.state = { data: props.data, tableClass: props.className};
  }

  render() {
    if (!this.state.data) {
      return '';
    }
    var results = this.state.data;
    if (results.length === 1) {
      // Add this back in.
      return renderUncontestedRace(results[0], this.state.tableClass);
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
      <div class={this.state.tableClass}>
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
          {calculatePrecinctsReporting(
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
}
