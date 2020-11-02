import { h, Fragment, Component, createRef } from "preact";
import track from "../../lib/tracking";
import {
  reportingPercentage,
  sortByOrder,
  formatters,
  getAvailableMetrics,
  getParty,
  getCountyCandidates,
} from "../util.js";
var { percentDecimal, voteMargin } = formatters;

export default class ResultsTableCounty extends Component {
  constructor(props) {
    super();

    this.availableMetrics = getAvailableMetrics(props.state);
    this.tableRef = createRef();
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
    this.state = {
      sortMetric: this.availableMetrics.population,
      displayedMetric: this.availableMetrics.population,
      collapsed: true,
      order: -1,
    };
  }

  scrollToRef(ref) {
    if (ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView();
    }
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
    const orderedCandidates = this.props.sortOrder.slice(0, 3);
    if (orderedCandidates.length < this.props.sortOrder.length)
      orderedCandidates.push({ last: "Other", party: "Other" });
    return (
      <div
        class={
          "results-counties " + this.state.sortMetric.key.split("_").join("-")
        }>
        <h3>County Results Table</h3>
        {this.getSorter()}
        <table class={`results-table candidates-${orderedCandidates.length}`}>
          <thead ref={this.tableRef}>
            <tr>
              <th
                class="county sortable"
                onclick={() => this.updateSort("countyName")}>
                <div>
                  <span class="county">County</span>
                </div>
              </th>
              <th
                class="amt precincts"
                onclick={() => this.updateSort("countyName")}>
                <div>{this.getIcon("countyName")}</div>
              </th>
              {orderedCandidates.map(cand => CandidateHeaderCell(cand))}
              <th class="vote margin">
                <div>
                  <span class="title">Vote margin</span>
                </div>
              </th>
              <th
                class="comparison sortable"
                onclick={() => this.updateSort(this.state.displayedMetric.key)}>
                <div>
                  <span class="title">{this.state.displayedMetric.name}</span>
                  {this.getIcon(this.state.displayedMetric.key)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody class={this.state.collapsed ? "collapsed" : null}>
            {sortedData.map(c => (
              <ResultsRowCounty
                key={c.fips}
                orderedCandidates={orderedCandidates}
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
    var sortMetric = this.availableMetrics[metricName];
    var order = sortMetric.alpha ? 1 : -1;
    if (sortMetric == this.state.sortMetric) {
      order = this.state.order * -1;
      track("county-sort", metricName);
    } else {
      track("county-metric", metricName);
    }
    var state = { sortMetric, order };
    if (opt_newMetric)
      state.displayedMetric = this.availableMetrics[metricName];
    this.setState(state);
  }

  getIcon(metric) {
    var sorted = this.state.sortMetric.key == metric;
    var svg = (
      <svg
        aria-hidden="true"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="16"
        viewBox="0 0 320 512">
        <path
          fill={sorted && this.state.order < 0 ? "#999" : "#ddd"}
          d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"
          class=""></path>
        <path
          fill={sorted && this.state.order > 0 ? "#999" : "#ddd"}
          d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"
          class=""></path>
      </svg>
    );
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
        if (sorterA.party === "Dem" && sorterB.party === "GOP")
          return -1 * order;
        if (sorterA.party === "GOP" && sorterB.party === "Dem")
          return 1 * order;

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
        <li class="label">Sort Counties By:</li>
        {Object.keys(this.availableMetrics).map(m =>
          this.getSorterLi(this.availableMetrics[m])
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
        <span class="pipe"> | </span>
      </li>
    );
  }
}

function ResultsRowCounty(props) {
  var { orderedCandidates, row, metric } = props;
  var topCands = orderedCandidates.map(c => c.last);
  var candidates = orderedCandidates.map(function (header) {
    // If no other candidate, get total percent of other votes
    if (header.last == "Other") {
      var other = mergeOthers(row.candidates, header.id, topCands);
      return other;
    }
    var [match] = row.candidates.filter(c => header.id == c.id);
    return match || "";
  });

  var metricValue = row.county[metric.key];

  if (metric.format) {
    metricValue = metric.format(metricValue);
  }

  var leadingCand = row.reportingPercent > 0.5 ? row.candidates[0] : "";
  var reportingPercent = reportingPercentage(row.reportingPercent) + "% in";

  return (
    <tr>
      <td class="county">
        <span>{row.county.countyName}</span>
        <span class="precincts mobile">{reportingPercent}</span>
      </td>
      <td class="precincts amt">{reportingPercent}</td>
      {candidates.map(c =>
        CandidatePercentCell(
          c,
          c.party == leadingCand.party && c.last == leadingCand.last,
          row.reportingPercent
        )
      )}
      {MarginCell(row.candidates, leadingCand, topCands)}
      <td class="comparison"> {metricValue} </td>
    </tr>
  );
}

function CandidateHeaderCell(candidate) {
  return (
    <th class="vote" key={candidate.party}>
      <div>
        <span class="title">{candidate.last}</span>
      </div>
    </th>
  );
}

/*
 * Creates a candidate vote % cell. Colors with candidate party if candidate is leading.
 */
function CandidatePercentCell(candidate, leading, percentIn) {
  var displayPercent = percentDecimal(candidate.percent);
  var party = getParty(candidate.party);
  var allIn = percentIn >= 1;
  return (
    <td class={`vote ${party} ${leading ? "leading" : ""} ${allIn ? "allin" : ""}`} key={candidate.id}>
      {displayPercent}
    </td>
  );
}

/*
 * Creates the margin cell. Colors with candidate party if candidate is leading.
 */
function MarginCell(candidates, leadingCand, topCands) {
  var party;
  var voteMargin = "-";
  if (topCands.includes(candidates[0].last)) {
    voteMargin = calculateVoteMargin(candidates);
    if (leadingCand) {
      var party = getParty(leadingCand.party);
    }
  }

  return <td class={`vote margin ${party}`}>{voteMargin}</td>;
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
  return voteMargin({ party: getParty(a.party), margin: winnerMargin });
}

// Borrowed from normalize
var mergeOthers = function (candidates, raceID, topCandidates) {
  // Only merged not top X candidates in state.
  var remaining = candidates.filter(c => !topCandidates.includes(c.last));
  var other = {
    first: "",
    last: "Other",
    party: "Other",
    id: `other-${raceID}`,
    percent: 0,
    mobilePercent: 0,
  };
  for (var c of remaining) {
    other.percent += c.percent || 0;
  }
  return other;
};
