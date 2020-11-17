import { formatters } from "./formatters.js";

const availableMetrics = {
  population: {
    name: "Population",
    format: formatters.comma,
  },
  past_margin: {
    name: "2016 Presidential Margin",
    format: formatters.voteMargin,
  },
  unemployment: {
    name: "Unemployment",
    format: formatters.percentDecimal,
  },
  percent_white: {
    name: "% White",
    format: formatters.percentDecimal,
  },
  percent_black: {
    name: "% Black",
    format: formatters.percentDecimal,
  },
  percent_hispanic: {
    name: "% Hispanic",
    format: formatters.percentDecimal,
  },
  median_income: {
    name: "Median Income",
    format: formatters.chain([formatters.comma, formatters.dollars]),
  },
  percent_bachelors: {
    name: "% College-Educated",
    format: formatters.percent,
  },
  covid: {
    name: "COVID-19 Cases Per 1,000",
    format: formatters.comma,
  },
  countyName: {
    name: "County",
    alpha: true,
    hideFromToggle: true,
  },
};

for (var k in availableMetrics) availableMetrics[k].key = k;

export function getAvailableMetrics(state) {
  var metrics = { ...availableMetrics };
  if (state == "UT") {
    delete metrics["covid"];
  }
  return metrics;
}

export function getCountyVariable(data, variable) {
  var value = data[variable];
  // Have to special case past margin.
  if (variable == "past_margin") {
    value = value.margin * (value.party == "Dem" ? 1 : -1);
  }
  return value * 1;
}

export function getCountyCandidates(overall, counties) {
  var countyWinners = counties
    .filter(c => (c.reportingPercent && c.reportingPercent > 0.5))
    .map(c => c.candidates[0]);
  countyWinners = countyWinners.filter(function (obj, index, self) {
    return (
      index ===
      self.findIndex(function (t) {
        return t.last === obj.last;
      })
    );
  });
  var overallLeaders = overall.slice(0, 2).concat(countyWinners);
  overallLeaders = overallLeaders.filter(function (obj, index, self) {
    return (
      index ===
      self.findIndex(function (t) {
        return t.last === obj.last;
      })
    );
  });
  return overallLeaders;
}