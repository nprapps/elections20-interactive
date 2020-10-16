import { h, Fragment, Component, createRef } from "preact";
import "./resultsTableCounty.less";
import {
  reportingPercentage,
  sortByOrder,
  formatters,
  availableMetrics,
} from "../util.js";
var { percentDecimal, voteMargin } = formatters;

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

    // Order by lead in overall state race
    const orderedCandidates = this.props.sortOrder;
    return (
      <div
        class={
          "results-counties " + this.state.sortMetric.key.split("_").join("-")
        }>
        {this.getSorter()}
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
              <th
                class="amt precincts"
                onclick={() => this.updateSort("countyName")}>
                <div>
                  <span></span>
                  {this.getIcon("countyName")}
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
                  {this.getIcon(this.state.displayedMetric.key)}
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

  updateSort(metricName, opt_newMetric = false) {
    var sortMetric = availableMetrics[metricName];
    var order = sortMetric.alpha ? -1 : 1;
    if (sortMetric == this.state.sortMetric) {
      order = this.state.order * -1;
    }
    var state = { sortMetric, order };
    if (opt_newMetric) state.displayedMetric = availableMetrics[metricName];
    this.setState(state);
  }

  getIcon(metric) {
    var svg;
    if (metric == this.state.sortMetric.key) {
      if (this.state.order < 0) {
        svg = (
          <svg
            aria-hidden="true"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
            width="10"
            height="16">
            <path
              fill="#999"
              d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"
              class=""></path>
          </svg>
        );
      } else {
        svg = (
          <svg
            aria-hidden="true"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="16"
            viewBox="0 0 320 512">
            <path
              fill="#999"
              d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"
              class=""></path>
          </svg>
        );
      }
    } else {
      svg = (
        <svg
          aria-hidden="true"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 320 512"
          width="10"
          height="16"
          class="">
          <path
            fill="#ccc"
            d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"
            class=""></path>
        </svg>
      );
    }
    return <span>{svg}</span>;
  }

  sortCountyResults() {
    var { sortMetric, order } = this.state;

    var data = this.props.data.slice();
    data.sort(function (a, b) {
      let sorterA, sorterB;

      sorterA = a.county[sortMetric.key];
      sorterB = b.county[sortMetric.key];

      // Special sorting for county names and past margin.
      if (sortMetric.alpha) {
        return sorterA == sorterB ? 0 : sorterA < sorterB ? order : order * -1;
      } else if (sortMetric.key == "past_margin") {
        // always put Democratic wins on top
        if (sorterA.party === "Dem" && sorterB.party === "GOP") return -1 * order;
        if (sorterA.party === "GOP" && sorterB.party === "Dem") return 1 * order;

        const aMargin = sorterA.margin * 1;
        const bMargin = sorterB.margin * 1;

        // if Republican, sort in ascending order
        // if Democratic, sort in descending order
        if (sorterA.party === "GOP") {
          return (aMargin - bMargin) * order;
        } else {
          return (bMargin - aMargin) * order;
        }
      }
      return (sorterA - sorterB) * order;
    });
    return data;
  }

  getSorter() {
    return (
      <ul class="sorter">
        <li class="label">Sort Counties By</li>
        {Object.keys(availableMetrics).map(m =>
          this.getSorterLi(availableMetrics[m])
        )}
      </ul>
    );
  }

  getSorterLi(metric) {
    if (metric.hideFromToggle) {
      return;
    }
    var selected = metric == this.state.displayedMetric ? "selected" : "";
    return (
      <li
        class={`sortButton ${selected}`}
        onclick={() => this.updateSort(metric.key, true)}>
        <span class="metric">{metric.name}</span>
        {metric.last ? "" : <span class="pipe"> | </span>}
      </li>
    );
  }
}

function ResultsRowCounty(props) {
  var { candidates, row, metric } = props;

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
      {MarginCell(row.candidates, leadingParty)}
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
  var displayPercent = percentDecimal(candidate.percent);
  return (
    <td
      class={`vote ${candidate.party} ${leading ? "winner" : ""}`}
      key={candidate.id}>
      {`${displayPercent}`}
    </td>
  );
}

/*
 * Creates the margin cell. Colors with candidate party if candidate is leading.
 */
function MarginCell(candidates, leading) {
  var party;
  if (leading) {
    party = ["Dem", "GOP"].includes(leading) ? leading : "ind";
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
  return voteMargin({ party: a.party, margin: winnerMargin });
}
