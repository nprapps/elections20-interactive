import { h, Fragment, Component, createRef } from "preact";
import "./resultsTableCounty.less";
import {
  reportingPercentage,
  formatters,
  sortByOrder,
} from "../util.js";
var { chain, comma, percent, dollars } = formatters;

const availableMetrics = {
  population: {
    name: "Population",
    census: true,
    format: comma,
  },
  past_margin: {
    name: "2016 Presidential Margin",
  },
  unemployment: {
    name: "Unemployment",
    format: percent,
  },
  percent_white: {
    name: "% White",
    census: true,
    format: percent,
  },
  percent_black: {
    name: "% Black",
    census: true,
    format: percent,
  },
  percent_hispanic: {
    name: "% Hispanic",
    census: true,
    format: percent,
  },
  median_income: {
    name: "Median Income",
    census: true,
    format: chain(comma, dollars),
  },
  percent_bachelors: {
    name: "% College-Educated",
    census: true,
    format: percent,
  },
  countyName: {
    name: "County",
    alpha: true,
  },
};
for (var k in availableMetrics) availableMetrics[k].key = k;

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
    ref.current.scrollIntoView(true, { block: "nearest" });
  }

  toggleCollapsed() {
    const currentState = this.state.collapsed;
    this.setState({ collapsed: !currentState }, () => {
      this.scrollToRef(this.tableRef);
    });
  }

  render() {
    var sortedData = this.sortCountyResults();

    // Order by party
    const orderedCandidates = this.props.data[0].candidates
      .slice(0, 3)
      .sort((a, b) => sortByOrder(a.last, b.last, this.props.sortOrder));
      console.log(orderedCandidates)
    return (
      <div
        class={
          "results-counties " + this.state.sortMetric.key.split("_").join("-")
        }>
        <table class={`results-table candidates-${orderedCandidates.length}`}>
          <thead ref={this.tableRef}>
            <tr>
              <th
                class="county sortable"
                onclick={() => this.updateSort("countyName")}>
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
                class="comparison sortable"
                onclick={() => this.updateSort(this.state.displayedMetric.key)}>
                <div>
                  <span>{this.state.displayedMetric.name}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class={this.state.collapsed ? "collapsed" : null}>
            {sortedData.map(c => (
              <ResultsRowCounty
                candidates={orderedCandidates}
                row={c}
                metric={this.state.displayedMetric}
              />
            ))}
          </tbody>
        </table>

        <button
          class={`toggle-table ${sortedData.length > 10 ? "" : "hidden"}`}
          onclick={this.toggleCollapsed}
          data-more="Show all"
          data-less="Show less">
          {this.state.collapsed ? `Show all ▼` : `Show less ▲`}
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
    data.sort(function (a, b) {
      let sorterA, sorterB;

      sorterA = a.county[sortMetric.key];
      sorterB = b.county[sortMetric.key];

      if (sortMetric.alpha) {
        return sorterA == sorterB ? 0 : sorterA < sorterB ? order : order * -1;
      }
      return (sorterA - sorterB) * order;
    });
    return data;
  }
}

function ResultsRowCounty(props) {
  var { candidates, row, metric } = props;

  var winner = row.called ? row.candidates[0] : null;

  var orderedCandidates = candidates.map(function (header) {
    var [match] = row.candidates.filter(c => header.id == c.id);
    return match || {};
  });

  var metricValue = row.county[metric.key];

  if (metric.format) {
    metricValue = metric.format(metricValue);
  }

  var leadingParty = row.reportingPercent == 1 ? row.candidates[0].party : "";

  return (
    <tr>
      <td class="county">
        <span class="precincts mobile">{row.county.countyName}</span>
      </td>
      <td class="precincts amt">
        {reportingPercentage(row.reporting / row.precincts) + "% in"}
      </td>
      {orderedCandidates.map(c =>
        CandidatePercentCell(c, c.party == leadingParty)
      )}
      {MarginCell(row.candidates, winner)}
      <td> {metricValue} </td>
    </tr>
  );
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

/*
 * Creates a candidate vote % cell. Colors with candidate party if candidate is leading.
 */
function CandidatePercentCell(candidate, leading) {
  // TODO: add in independent class
  var displayPercent = (candidate.percent * 100).toFixed(1);
  return (
    <td
      class={`vote ${candidate.party} ${leading ? "winner" : ""}`}
      key={candidate.id}>
      {`${displayPercent}%`}
    </td>
  );
}

/*
 * Creates the margin cell. Colors with candidate party if candidate is leading.
 */
function MarginCell(candidates, leading) {
  var party;
  if (leading) {
    party = ["Dem", "GOP"].includes(leading.party) ? leading.party : "ind";
  }

  return (
    <td class={`vote margin ${party}`}>{calculateVoteMargin(candidates)}</td>
  );
}

/*
 * Calculate the vote margin to be displayed.
 */
function calculateVoteMargin(candidates) {
  var [a, b] = candidates;
  if (!a.votes) {
    return "-";
  }
  var winnerMargin = a.percent - b.percent;

  let prefix;
  if (a.party === "Dem") {
    prefix = "D";
  } else if (a.party === "GOP") {
    prefix = "R";
  } else {
    prefix = "I";
  }

  return prefix + " +" + Math.round(winnerMargin * 100);
}
