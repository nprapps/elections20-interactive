import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { calculatePrecinctsReporting } from "../util.js";

export class RacewideTable extends Component {
  constructor(props) {
    super();

    console.log(props.data);
    this.state = { data: props.data, tableClass: props.className };
  }

  render() {
    if (!this.state.data) {
      return "";
    }
    var results = this.state.data;
    const seatName = results.office === "H" ? results.seat : null;
    if (results.candidates.length === 1) {
      // TODO: Add this back in if needed.
      return this.renderUncontestedRace(
        results.candidates[0],
        seatName,
        this.state.tableClass
      );
    }

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
            {results.candidates.map((result) => this.renderRow(result))}
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
        class={this.createClassesForCandidateRow(result, this.state.tableClass)}
      >
        <td class="seat-status">
          {result.pickup ? <span class="pickup"></span> : ""}
        </td>
        {this.renderCandidateName(result)}
        <td class="amt">{result.votes}</td>
        <td class="amt">
          {((parseFloat(result.percent) || 0) * 100).toFixed(1)}%
        </td>
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

  // TODO: share some of this code with the other table
  renderUncontestedRace(result, seatName, tableClass) {
    // TODO: add back in pickup information here, and everywhere
    return (
      <div class={tableClass}>
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
              <th class="seat-status" scope="col"></th>
              <th class="candidate" scope="col">
                Candidate
              </th>
              <th class="amt" scope="col">
                Votes
              </th>
              <th class="" scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr class={this.createClassesForCandidateRow(result)}>
              <td class="seat-status">
                {result.pickup ? <span class="pickup"></span> : ""}
              </td>
              <td>{this.renderCandidateName(result)}</td>
              <td class="amt uncontested">Uncontested</td>
            </tr>
          </tbody>
        </table>
        <p class="precincts">TKTK AP uncontested note </p>
      </div>
    );
  }

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
