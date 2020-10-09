import { h, Fragment, Component, createRef } from "preact";
import "./resultsTableCounty.less";
import { fmtComma } from "../util.js";
import { reportingPercentage } from "../util.js";

var formatters = {
  percent: v => Math.round(v * 100) + "%",
  comma: v => (v * 1).toLocaleString(),
  dollars: v => "$" + v
}

const availableMetrics = {
  population: {
    name: "Population",
    key: "population",
    census: true,
    format: formatters.comma
  },
  past_margin: {
    name: "2016 Presidential Margin",
    key: "past_margin",
    census: false,
  },
  unemployment: {
    name: "Unemployment",
    key: "unemployment",
    census: false,
    format: formatters.percent
  },
  percent_white: {
    name: "% White",
    key: "percent_white",
    census: true,
    format: formatters.percent
  },
  percent_black: {
    name: "% Black",
    key: "percent_black",
    census: true,
    format: formatters.percent
  },
  percent_hispanic: {
    name: "% Hispanic",
    key: "percent_hispanic",
    census: true,
    format: formatters.percent
  },
  median_income: {
    name: "Median Income",
    key: "median_income",
    census: true,
    comma_filter: true,
    format: formatters.dollar
  },
  percent_bachelors: {
    name: "% College-Educated",
    key: "percent_bachelors",
    census: true,
    format: formatters.percent
  },
  countyName: {
    name: "County",
    key: "countyName",
    census: false,
    alpha: true,
  },
};

export default class ResultsTableCounty extends Component {
  constructor(props) {
    super();

    this.tableRef = createRef();
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
    this.state = {
      sortMetric: availableMetrics.population,
      displayedMetric: availableMetrics.population,
      collapsed: true,
      order: -1,
    };
  }

  scrollToRef(ref) {
    // TODO: fix buggy first click behavior
    if (!this.state.collapsed) {
      ref.current.scrollIntoView(true, { block: "nearest" });
    }
  }

  toggleCollapsed() {
    const currentState = this.state.collapsed;
    this.setState({ collapsed: !currentState });
    this.scrollToRef(this.tableRef);
  }

  render() {
    var sortedData = this.sortCountyResults();
    // Order by party
    const orderedCandidates = this.props.data[0].candidates
      .slice(0, 2)
      .sort((a, b) => (a.party < b.party ? -1 : 1));

    return (
      <div
        class={
          "results-counties " +
          this.state.sortMetric.key.split("_").join("-")
        }>
        <table class={`results-table candidates-${orderedCandidates.length}`}>
          <thead ref={this.tableRef}>
            <tr>
              <th class="county" onclick={() => this.updateSort("countyName")}>
                <div>
                  <span>County</span>
                </div>
              </th>
              <th class="amt precincts">
                <div>
                  <span></span>
                </div>
              </th>
              {orderedCandidates.map(cand => CandidateHeaderCell(cand))}
              <th class="vote margin">
                <div>
                  <span>Vote margin</span>
                </div>
              </th>
              <th
                class="comparison"
                onclick={() =>
                  this.updateSort(this.state.displayedMetric.key)
                }>
                <div>
                  <span>{this.state.displayedMetric.name}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class={this.state.collapsed ? "collapsed" : null}>
            {sortedData.map(c => (
              <ResultsRowCounty row={c} metric={this.state.displayedMetric} />
            ))}
          </tbody>
        </table>

        <button
          class={`toggle-table ${ sortedData.length > 10 ? '' : 'hidden'}`}
          onclick={this.toggleCollapsed}
          data-more="Show more"
          data-less="Show less">
          {this.state.collapsed ? "Show more" : "Show less"}
        </button>
      </div>
    );
  }

  updateSort(metricName) {
    var sortMetric = availableMetrics[metricName];
    var order = sortMetric.alpha ? -1 : 1;
    if (sortMetric == this.state.sortMetric) {
      order = this.state.order * -1;
    }
    this.setState({ sortMetric, order });
  }

  sortCountyResults() {
    var { sortMetric, order } = this.state;

    var data = this.props.data.slice();
    data.sort(function(a, b) {

      let sorterA, sorterB;

      if (sortMetric.census) {
        sorterA = a.county.census[sortMetric.key];
        sorterB = b.county.census[sortMetric.key];
      } else {
        sorterA = a.county[sortMetric.key];
        sorterB = b.county[sortMetric.key];
      }

      if (sortMetric.alpha) {
        return sorterA == sorterB ? 0 : sorterA < sorterB ? order : order * -1;
      }
      return (sorterA - sorterB) * order;
    });
    return data;
  }
}

function CandidateHeaderCell(candidate) {
  return (
    <th class="vote" key={candidate.party}>
      <div>
        <span>{candidate.last}</span>
      </div>
    </th>
  );
}

function ResultsRowCounty(props) {
  // TODO: figure out if this can be done a cleaner way
  // DO we want to mark someone as a winner if 100% are reporting but it hasn't been called?
  var determineWinner = results => {
    if (parseInt(results.reporting) / parseInt(results.precincts) < 1) {
      return null;
    }

    // First candidate should be leading/winner since we sort by votes.
    return results.candidates[0];
  };

  var row = props.row;
  var displayMetric = props.metric;

  var availableCandidates = row.candidates
    .slice(0, 2)
    .sort((a, b) => (a.party < b.party ? -1 : 1));

  // Default to population.
  let extraMetric;
  if (displayMetric.census) {
    extraMetric = row.county.census[displayMetric.key];
  } else {
    // TODO: get the rest of these working, if we decide to use them
    extraMetric = row.county[displayMetric.key];
  }
  extraMetric = parseInt(extraMetric);

  if (displayMetric.format) {
    extraMetric = displayMetric.format(extraMetric);
  }

  var winner = determineWinner(row);

  return (
    <tr>
      <td class="county">
        <span class="precincts mobile">{row.county.countyName}</span>
      </td>
      <td class="precincts amt">
        {reportingPercentage(row.reporting / row.precincts) + "% in"}
      </td>
      {availableCandidates.map(c => CandidatePercentCell(c))}
      {MarginCell(row.candidates, winner)}
      <td> {extraMetric} </td>
    </tr>
  );
}

// Display a candidate % cell
function CandidatePercentCell(candidate) {
  // TODO: add in independent class
  var displayPercent = (candidate.percent * 100).toFixed(1);
  return (
    <td
      class={`vote ${candidate.party.toLowerCase()} ${
        candidate.winner ? "winner" : ""
      }`}
      key={candidate.id}>
      {`${displayPercent}%`}
    </td>
  );
}

function MarginCell(candidates, winner) {
  var party;
  if (winner) {
    party = ["Dem", "GOP"].includes(winner.party)
      ? winner.party.toLowerCase()
      : "ind";
  }

  return (
    <td class={`vote margin ${party}`}>{calculateVoteMargin(candidates)}</td>
  );
}

function calculateVoteMargin(candidates) {
  // TODO: re-do what to do here if there isn't someone ahead or it's low vote count
  if (!candidates[0].votes) {
    return "-";
  }
  var winnerMargin = candidates[0].percent - candidates[1].percent;

  let prefix;
  if (candidates[0].party === "Dem") {
    prefix = "D";
  } else if (candidates[0].party === "GOP") {
    prefix = "R";
  } else {
    prefix = "I";
  }

  return prefix + " +" + Math.round(winnerMargin * 100);
}
