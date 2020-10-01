import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { calculatePrecinctsReporting } from "../util.js";

export class RacewideTable extends Component {
  constructor(props) {
    super();

    this.state = { data: props.data, tableClass: props.className };
  }

  render() {
    if (!this.state.data) {
      return "";
    }
    var results = this.state.data;
    if (results.candidates.length === 1) {
      // TODO: Add this back in if needed.
      return renderUncontestedRace(results.candidate[0], this.state.tableClass);
    }

    const seatName =
      results.officename === "U.S. House" ? results.seatname : null;
    let totalVotes = 0;
    for (let i = 0; i < results.candidates.length; i++) {
      totalVotes += results.candidates[i].votes;
    }

    // TODO: check if the sorting removed here is still necessary
    // if (results.candidates.length > 2) {
    //   results.candidates = this.sortResults(results.candidates);
    // }

    return (
      <div class={this.state.tableClass}>
        <table class="results-table">
          {seatName ? <caption> {seatName}</caption> : ""}
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
          <tbody>
            {results.candidates.map(result => this.renderRow(result))}
          </tbody>
          <tfoot>
            <tr>
              <td class="seat-status"></td>
              <th class="candidate" scope="row">
                Total
              </th>
              <td class="amt">{parseInt(totalVotes)}</td>
              <td class="amt">100%</td>
            </tr>
          </tfoot>
        </table>
        <p class="precincts">
          {calculatePrecinctsReporting(
            parseInt(results.reporting) / parseInt(results.precincts)
          ) +
            "% of precincts reporting (" +
            results.reporting +
            " of " +
            results.precincts +
            ")"}
        </p>
      </div>
    );
  }

  renderRow(result) {
    // TODO add classes back in
    return (
      <tr
        class={this.createClassesForCandidateRow(
          result,
          this.state.tableClass
        )}>
        <td class="seat-status">
          {result.pickup ? <span class="pickup"></span> : ""}
        </td>
        {this.renderCandidateName(result)}
        <td class="amt">{result.votes}</td>
        <td class="amt">{(parseFloat(result.percent) * 100).toFixed(1)}%</td>
      </tr>
    );
  }

  renderCandidateName(result) {
    // Handle `Other` candidates, which won't have a `party` property
    const party = result.party ? ` (${result.party})` : "";

    return (
      <td class="candidate" scope="col">
        <span class="fname">{result.first} </span>
        <span class="lname">{result.last}</span>
        {party}
        {result.npr_winner ? <i class="icon icon-ok"></i> : ""}
      </td>
    );
  }

  // TODO: figure out if this is necessary or can be combined with multiple results.
  // renderUncontestedRace(result, tableClass) {
  //   const seatName = result.officename === 'U.S. House'
  //     ? result.seatname
  //     : null;

  //   return <div class={tableClass}>
  //             <table>
  //             </table>
  //         </div>

  //   return maquette.h(`div.${tableClass}`, [
  //     maquette.h('table.results-table', [
  //       seatName ? maquette.h('caption', seatName) : '',
  //       maquette.h('colgroup', [
  //         maquette.h('col.seat-status'),
  //         maquette.h('col.candidate'),
  //         maquette.h('col')
  //       ]),
  //       maquette.h('thead', [
  //         maquette.h('tr', [
  //           maquette.h('th.seat-status', ''),
  //           maquette.h('th.candidate', 'Candidate'),
  //           maquette.h('th', '')
  //         ])
  //       ]),
  //       maquette.h('tbody',
  //         maquette.h('tr', { classes: createClassesForCandidateRow(result) }, [
  //           maquette.h('td.seat-status', [
  //             result.pickup
  //               ? maquette.h('span.pickup', { class: 'pickup' })
  //               : ''
  //           ]),
  //           renderCandidateName(result),
  //           maquette.h('td.amt.uncontested', 'uncontested')
  //         ])
  //       )
  //     ]),
  //     maquette.h('p.precincts', [ copy.ap_uncontested_note ])
  //   ]);
  // }

  createClassesForCandidateRow(result) {
    let classlist = "";
    if (result.npr_winner) {
      classlist += " winner";
      classlist += result["party"].toLowerCase();

      if (!["Dem", "GOP"].includes(result["party"])) {
        classlist += "ind";
      }
    }
    if (result["incumbent"]) {
      classlist += " incumbent";
    }
    return classlist;
  }

  sortResults(results) {
    results.sort(function (a, b) {
      if (a.last === "Other") return 1;
      if (b.last === "Other") return -1;
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
}
