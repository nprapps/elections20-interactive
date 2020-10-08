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

  // scrollToRef(ref) {
  //   // TODO: will this work with embeds?
  //   // if (this.state.collapsed) {
  //     ref.current.scrollIntoView({ behavior: "smooth" });
  //   // }
  // }

  toggleCollapsed() {
    const currentState = this.state.collapsed;
    this.setState({ collapsed: !currentState });
  }

  updateSort(metricName) {
    var metric = availableMetrics.filter(m => m.name == metricName)[0];
    var prevOrder = this.state.topToBottom;
    this.setState({ sortMetric: metric, topToBottom: !prevOrder });
  }

  render() {
    const sortKeys = this.sortCountyResults(
      this.props.data,
      this.state.sortMetric
    );
    const availableCandidates = this.props.data[0].candidates
      .slice(0, 2)
      .sort((a, b) => (a.party < b.party ? -1 : 1));

    return (
      <div
        class={
          "results-counties " +
          this.state.sortMetric["key"].split("_").join("-")
        }>
        <table class={`results-table candidates-${availableCandidates.length}`}>
          <thead>
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
              {availableCandidates.map(cand => this.renderCandidateTH(cand))}
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
          <tbody
            class={this.state.collapsed ? "collapsed" : null}
            ref={this.tableRef}>
            {sortKeys.map(key =>
              this.renderCountyRow(
                this.props.data.filter(a => a.fips == key[0])[0],
                this.state.sortMetric
              )
            )}
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

  renderCandidateTH(candidate) {
    return (
      <th class="vote" key={candidate.party}>
        <div>
          <span>{candidate.last}</span>
        </div>
      </th>
    );
  }

  renderCountyRow(results) {
    var availableCandidates = results.candidates
      .slice(0, 2)
      .sort((a, b) => (a.party < b.party ? -1 : 1));

    // Default to population.
    let extraMetric = results.county.census.population;

    if (this.state.displayedMetric["census"]) {
      extraMetric = results.county.census[this.state.displayedMetric["key"]];
    } else {
      // TODO: get the rest of these working, if we decide to use them
      extraMetric = results.county[this.state.displayedMetric["key"]];
    }
    extraMetric = parseInt(extraMetric);

    if (this.state.displayedMetric["comma_filter"]) {
      extraMetric = fmtComma(extraMetric);
    }

    if (this.state.displayedMetric["percent_filter"]) {
      extraMetric = (extraMetric * 100).toFixed(1) + "%";
    }

    if (this.state.displayedMetric["prepend"]) {
      extraMetric = this.state.sortMetric["prepend"] + extraMetric;
    }

    if (this.state.displayedMetric["append"]) {
      extraMetric = extraMetric.toFixed(1) + this.state.sortMetric["append"];
    }

    var winner = this.determineWinner(results);

    return (
      <tr>
        <td class="county">
          <span class="precincts mobile">{results.county.countyName}</span>
        </td>
        <td class="precincts amt">
          {reportingPercentage(results.reporting / results.precincts) + "% in"}
        </td>
        {availableCandidates.map(key => this.renderCountyCell(key))}
        {this.renderMarginCell(results.candidates, winner)}
        <td> {extraMetric} </td>
      </tr>
    );
  }

  renderCountyCell(candidate) {
    // TODO: add in independent class
    return (
      <td
        class={`vote ${candidate.party.toLowerCase()} ${
          candidate.winner ? "winner" : ""
        }`}
        key={candidate.id}>
        {(candidate.percent * 100).toFixed(1) + "%"}
      </td>
    );
  }

  renderMarginCell(candidates, winner) {
    var party;
    if (winner) {
      party = ["Dem", "GOP"].includes(winner.party)
        ? winner.party.toLowerCase()
        : "ind";
    }

    var cell = (
      <td class={`vote margin ${party}`}>
        {this.calculateVoteMargin(candidates, winner)}
      </td>
    );
    return cell;
  }

  // TODO: figure out if this can be done a cleaner way
  // And test on results with values that aren't just 0
  determineWinner(results) {
    if (parseInt(results.reporting) / parseInt(results.precincts) < 1) {
      return null;
    }

    // First candidate should be leading/winner since we sort by votes.
    return results.candidates[0];
  }

  sortCountyResults() {
    var sortMetric = this.state.sortMetric;
    var topToBottom = this.state.topToBottom;
    var values = [];

    for (let county of this.props.data) {
      let sorter;
      if (this.state.sortMetric["census"]) {
        sorter = county.county.census[sortMetric["key"]];
      } else {
        sorter = county.county[sortMetric["key"]];
      }
      values.push([county.fips, sorter]);
    }

    values.sort(function (a, b) {
      // TODO: get this working
      if (sortMetric["key"] === "past_margin") {
        // always put Democratic wins on top
        if (a[1][0] === "D" && b[1][0] === "R") return -1;
        if (a[1][0] === "R" && b[1][0] === "D") return 1;

        const aMargin = parseInt(a[1].split("+")[1]);
        const bMargin = parseInt(b[1].split("+")[1]);

        // if Republican, sort in ascending order
        // if Democratic, sort in descending order
        if (a[1][0] === "R") {
          return aMargin - bMargin;
        } else {
          return bMargin - aMargin;
        }
      }

      if (sortMetric["alpha"]) {
        if (topToBottom) {
          return a[1] > b[1] ? -1 : 1;
        } else {
          return a[1] > b[1] ? 1 : -1;
        }
      } else {
        return topToBottom ? b[1] - a[1] : a[1] - b[1];
      }
    });
    return values;
  }

  calculateVoteMargin(results) {
    // TODO: re-do what to do here if there isn't someone ahead?
    if (!results[0].votes) {
      return "-";
    }
    var winnerMargin = results[0].percent - results[1].percent;

    let prefix;
    if (results[0].party === "Dem") {
      prefix = "D";
    } else if (results[0].party === "GOP") {
      prefix = "R";
    } else {
      prefix = "I";
    }

    return prefix + " +" + Math.round(winnerMargin * 100);
  }
}

// this.onMetricClick add me back in
function renderMetricLi(metric) {
  return (
    <li
      class={
        "sortButton " + metric === this.state.sortMetric ? "selected" : ""
      }>
      <span class="metric">{[metric["name"]]}</span>
      {metric.name !== "% College-Educated" ? <span class="pipe">|</span> : ""}
    </li>
  );
}
