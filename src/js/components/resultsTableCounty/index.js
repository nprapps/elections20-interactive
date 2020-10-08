import { h, Fragment, Component, createRef } from "preact";
import "./resultsTableCounty.less";
import { fmtComma } from "../util.js";
import { reportingPercentage } from "../util.js";

const availableMetrics = [
  {
    name: "Population",
    key: "population",
    census: true,
    comma_filter: true,
  },
  {
    name: "2016 Presidential Margin",
    key: "past_margin",
    census: false,
  },
  {
    name: "Unemployment",
    key: "unemployment",
    census: false,
    append: "%",
  },
  {
    name: "% White",
    key: "percent_white",
    census: true,
    percent_filter: true,
  },
  {
    name: "% Black",
    key: "percent_black",
    census: true,
    percent_filter: true,
  },
  {
    name: "% Hispanic",
    key: "percent_hispanic",
    census: true,
    percent_filter: true,
  },
  {
    name: "Median Income",
    key: "median_income",
    census: true,
    comma_filter: true,
    prepend: "$",
  },
  {
    name: "% College-Educated",
    key: "percent_bachelors",
    census: true,
    percent_filter: true,
  },
  {
    name: "County",
    key: "countyName",
    census: false,
    percent_filter: false,
    alpha: true,
  },
];

export default class ResultsTableCounty extends Component {
  constructor(props) {
    super();

    this.tableRef = createRef();
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
    this.state = {
      sortMetric: availableMetrics[0],
      displayedMetric: availableMetrics[0],
      collapsed: true,
      topToBottom: true,
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

  updateSort(metricName) {
    var metric = availableMetrics.filter(m => m.name == metricName)[0];
    var prevOrder = this.state.topToBottom;
    this.setState({ sortMetric: metric, topToBottom: !prevOrder });
  }

  render() {
    const sortedData = this.sortCountyResults(
      this.props.data,
      this.state.sortMetric
    );
    // Order by party
    const orderedCandidates = this.props.data[0].candidates
      .slice(0, 2)
      .sort((a, b) => (a.party < b.party ? -1 : 1));

    return (
      <div
        class={
          "results-counties " +
          this.state.sortMetric["key"].split("_").join("-")
        }>
        <table class={`results-table candidates-${orderedCandidates.length}`}>
          <thead ref={this.tableRef}>
            <tr>
              <th class="county" onclick={() => this.updateSort("County")}>
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
              <th class="vote margin" key="margin">
                <div>
                  <span>Vote margin</span>
                </div>
              </th>
              <th
                class="comparison"
                key="margin"
                onclick={() =>
                  this.updateSort(this.state.displayedMetric["name"])
                }>
                <div>
                  <span>{this.state.displayedMetric["name"]}</span>
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
          class="toggle-table"
          onclick={this.toggleCollapsed}
          data-more="Show more"
          data-less="Show less">
          {this.state.collapsed ? "Show more" : "Show less"}
        </button>
      </div>
    );
  }

  sortCountyResults() {
    var sortMetric = this.state.sortMetric;
    var topToBottom = this.state.topToBottom;

    return this.props.data.sort(function (a, b) {
      // TODO: get this working if needed?
      // if (sortMetric["key"] === "past_margin") {
      //   // always put Democratic wins on top
      //   if (a[1][0] === "D" && b[1][0] === "R") return -1;
      //   if (a[1][0] === "R" && b[1][0] === "D") return 1;

      //   const aMargin = parseInt(a[1].split("+")[1]);
      //   const bMargin = parseInt(b[1].split("+")[1]);

      //   // if Republican, sort in ascending order
      //   // if Democratic, sort in descending order
      //   if (a[1][0] === "R") {
      //     return aMargin - bMargin;
      //   } else {
      //     return bMargin - aMargin;
      //   }
      // }

      let sorterA;
      let sorterB;
      if (sortMetric["census"]) {
        sorterA = a.county.census[sortMetric["key"]];
        sorterB = b.county.census[sortMetric["key"]];
      } else {
        sorterA = a.county[sortMetric["key"]];
        sorterB = a.county[sortMetric["key"]];
      }

      if (sortMetric["alpha"]) {
        if (topToBottom) {
          return sorterA > sorterB ? -1 : 1;
        } else {
          return sorterA > sorterB ? 1 : -1;
        }
      } else {
        return topToBottom ? sorterB - sorterA : sorterA - sorterB;
      }
    });
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
  if (displayMetric["census"]) {
    extraMetric = row.county.census[displayMetric["key"]];
  } else {
    // TODO: get the rest of these working, if we decide to use them
    extraMetric = row.county[displayMetric["key"]];
  }
  extraMetric = parseInt(extraMetric);

  if (displayMetric["comma_filter"]) {
    extraMetric = fmtComma(extraMetric);
  }

  if (displayMetric["percent_filter"]) {
    extraMetric = (extraMetric * 100).toFixed(1) + "%";
  }

  if (displayMetric["prepend"]) {
    extraMetric = this.state.sortMetric["prepend"] + extraMetric;
  }

  if (displayMetric["append"]) {
    extraMetric = extraMetric.toFixed(1) + displayMetric["append"];
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

// this.onMetricClick add me back in if we add the table toggles
// function renderMetricLi(metric) {
//   return (
//     <li
//       class={
//         "sortButton " + metric === this.state.sortMetric ? "selected" : ""
//       }>
//       <span class="metric">{[metric["name"]]}</span>
//       {metric.name !== "% College-Educated" ? <span class="pipe">|</span> : ""}
//     </li>
//   );
// }
