import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { calculatePrecinctsReporting } from "../util.js";
import { ResultsTableCandidates } from "../resultsTableCandidates";
import { CountyMap } from "../countyMap";
import { fmtComma } from "../util.js";

const availableMetrics = [
  {
    name: "Population",
    key: "population",
    census: true,
    comma_filter: true
  },
  {
    name: "2016 Presidential Margin",
    key: "past_margin",
    census: false
  },
  {
    name: "Unemployment",
    key: "unemployment",
    census: false,
    append: "%"
  },
  {
    name: "% White",
    key: "percent_white",
    census: true,
    percent_filter: true
  },
  {
    name: "% Black",
    key: "percent_black",
    census: true,
    percent_filter: true
  },
  {
    name: "% Hispanic",
    key: "percent_hispanic",
    census: true,
    percent_filter: true
  },
  {
    name: "Median Income",
    key: "median_income",
    census: true,
    comma_filter: true,
    prepend: "$"
  },
  {
    name: "% College-Educated",
    key: "percent_bachelors",
    census: true,
    percent_filter: true
  }
];

export class CountyResults extends Component {
  constructor(props) {
    super();

    let sortMetric = availableMetrics[0];

    this.state = { activeView: props.view, sortMetric };
    this.onCountyData = this.onCountyData.bind(this);
    this.onStateData = this.onStateData.bind(this);
  }

  onCountyData(json) {
    var office = json[0].office;
    this.setState({ data: json, office });
  }

  onStateData(json) {
    this.setState({ stateData: json });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `/data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onCountyData
    );
    gopher.watch(`/data/states/${this.props.state}.json`, this.onStateData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `/data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onData
    );
    gopher.unwatch(`/data/states/${this.props.state}.json`, this.onStateData);
  }

  render() {
    if (!this.state.data || !this.state.stateData) {
      return "";
    }
    // const stateResults = this.state.data.filter(
    //   c => !(c.first === "" && c.last === "Other")
    // );
    // Render a county-level table below

    // TODO: get table working if we decide to use it.
    var countyLevel = this.getCountyLevelTable();

    return (
      <div class="results-elements">
        <h1>County results</h1>
        <CountyMap
          state={this.props.state.toUpperCase()}
          data={this.state.data}
        />
        {countyLevel}
      </div>
    );
  }

  getCountyLevelTable() {
    const sortKeys = this.sortCountyResults();
    const availableCandidates = this.state.data[0].candidates.slice(0,2).sort((a, b) => a.party < b.party ? -1 : 1);

    let countyLevel = "";
    countyLevel = (
      <div
        class={
          "results-counties " +
          this.state.sortMetric["key"].split("_").join("-")
        }
      >
        <h2>Results By County</h2>
        <table class={`results-table candidates-${availableCandidates.length}`}>
          <thead>
            <tr>
              <th class="county">
                <div>
                  <span>County</span>
                </div>
              </th>
              <th class="amt precincts">
                <div>
                  <span></span>
                </div>
              </th>
              {availableCandidates.map((cand) => this.renderCandidateTH(cand))}
              <th class="vote margin" key="margin">
                <div>
                  <span>Vote margin</span>
                </div>
              </th>
              <th class="comparison" key="margin">
                <div>
                  <span>{this.state.sortMetric["name"]}</span>
                </div>
              </th>
            </tr>
            {sortKeys.map((key) =>
              this.renderCountyRow(
                this.state.data.filter((a) => a.fips == key[0])[0]
              )
            )}
          </thead>
        </table>
      </div>
    );
    return countyLevel;
  }

  renderMetricLi(metric) {
    //this.onMetricClick add me back in
    return (
      <li
        class={
          "sortButton " + metric === this.state.sortMetric ? "selected" : ""
        }
      >
        <span class="metric">{[metric["name"]]}</span>
        {metric.name !== "% College-Educated" ? (
          <span class="pipe">|</span>
        ) : (
          ""
        )}
      </li>
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
    var availableCandidates = results.candidates.slice(0,2).sort((a, b) => a.party < b.party ? -1 : 1);
    let extraMetric;
    if (this.state.sortMetric["census"]) {
      extraMetric = results.county.census[this.state.sortMetric["key"]];
    } else {
      // TODO: get the rest of these working, if we decide to use them
      extraMetric = results.county[this.state.sortMetric["key"]];
    }
    extraMetric = parseInt(extraMetric);

    if (this.state.sortMetric["comma_filter"]) {
      extraMetric = fmtComma(extraMetric);
    }

    if (this.state.sortMetric["percent_filter"]) {
      extraMetric = (extraMetric * 100).toFixed(1) + "%";
    }

    if (this.state.sortMetric["prepend"]) {
      extraMetric = sortMetric["prepend"] + extraMetric;
    }

    if (this.state.sortMetric["append"]) {
      extraMetric = extraMetric.toFixed(1) + this.state.sortMetric["append"];
    }

    var winner = this.determineWinner(results);

    return (
      <tr>
        <td class="county">
          <span class="precincts mobile">{results.county.countyName}</span>
        </td>
        <td class="precincts amt">
          {calculatePrecinctsReporting(results.reporting/results.precincts) + "% in"}
        </td>
        {availableCandidates.map((key) => this.renderCountyCell(key))}
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
        key={candidate.id}
      >
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
    console.log(results.candidates[0], results)
    return results.candidates[0];
  }

  sortCountyResults() {
    if (!this.state) {
      return;
    }
    var sortMetric = this.state.sortMetric;
    var values = [];

    for (let county of this.state.data) {
      let sorter;
      if (sortMetric["census"]) {
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

      return b[1] - a[1];
    });
    return values;
  }

  calculateVoteMargin(results) {
    if (!results.reporting) {
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
