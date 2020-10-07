import { h, Fragment } from "preact";
import "./resultsTableCounty.less";
import { fmtComma } from "../util.js";
import { calculatePrecinctsReporting } from "../util.js";

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
];

export default function (props) {
  let sortMetric = availableMetrics[0];
  const sortKeys = sortCountyResults(props.data, sortMetric);
  const availableCandidates = props.data[0].candidates
    .slice(0, 2)
    .sort((a, b) => (a.party < b.party ? -1 : 1));

  let countyLevel = "";
  countyLevel = (
    <div
      class={
        "results-counties " + sortMetric["key"].split("_").join("-")
      }>
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
            {availableCandidates.map(cand => renderCandidateTH(cand))}
            <th class="vote margin" key="margin">
              <div>
                <span>Vote margin</span>
              </div>
            </th>
            <th class="comparison" key="margin">
              <div>
                <span>{sortMetric["name"]}</span>
              </div>
            </th>
          </tr>
          {sortKeys.map(key =>
            renderCountyRow(
              props.data.filter(a => a.fips == key[0])[0], sortMetric
            )
          )}
        </thead>
      </table>
    </div>
  );
  return countyLevel;
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

function renderCandidateTH(candidate) {
  return (
    <th class="vote" key={candidate.party}>
      <div>
        <span>{candidate.last}</span>
      </div>
    </th>
  );
}

function renderCountyRow(results, sortMetric) {
  console.log(results)
  var availableCandidates = results.candidates
    .slice(0, 2)
    .sort((a, b) => (a.party < b.party ? -1 : 1));
  let extraMetric;
  if (sortMetric["census"]) {
    extraMetric = results.county.census[sortMetric["key"]];
  } else {
    // TODO: get the rest of these working, if we decide to use them
    extraMetric = results.county[sortMetric["key"]];
  }
  extraMetric = parseInt(extraMetric);

  if (sortMetric["comma_filter"]) {
    extraMetric = fmtComma(extraMetric);
  }

  if (sortMetric["percent_filter"]) {
    extraMetric = (extraMetric * 100).toFixed(1) + "%";
  }

  if (sortMetric["prepend"]) {
    extraMetric = sortMetric["prepend"] + extraMetric;
  }

  if (sortMetric["append"]) {
    extraMetric = extraMetric.toFixed(1) + sortMetric["append"];
  }

  var winner = determineWinner(results);

  return (
    <tr>
      <td class="county">
        <span class="precincts mobile">{results.county.countyName}</span>
      </td>
      <td class="precincts amt">
        {calculatePrecinctsReporting(results.reporting / results.precincts) +
          "% in"}
      </td>
      {availableCandidates.map(key => renderCountyCell(key))}
      {renderMarginCell(results.candidates, winner)}
      <td> {extraMetric} </td>
    </tr>
  );
}

function renderCountyCell(candidate) {
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

function renderMarginCell(candidates, winner) {
  var party;
  if (winner) {
    party = ["Dem", "GOP"].includes(winner.party)
      ? winner.party.toLowerCase()
      : "ind";
  }

  var cell = (
    <td class={`vote margin ${party}`}>
      {calculateVoteMargin(candidates, winner)}
    </td>
  );
  return cell;
}

// TODO: figure out if this can be done a cleaner way
// And test on results with values that aren't just 0
function determineWinner(results) {
  if (parseInt(results.reporting) / parseInt(results.precincts) < 1) {
    return null;
  }

  // First candidate should be leading/winner since we sort by votes.
  return results.candidates[0];
}

function sortCountyResults(data, sortMetric) {
  var values = [];

  for (let county of data) {
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

function calculateVoteMargin(results) {
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
