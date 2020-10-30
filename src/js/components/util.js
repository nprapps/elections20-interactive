/*
  Display-friendly formatting for reporting numbers (don't round to 0/100%)
*/
export function reportingPercentage(pct) {
  if (pct > 0 && pct < 0.005) {
    return "<1";
  } else if (pct > 0.995 && pct < 1) {
    return ">99";
  } else {
    return Math.round(pct * 100);
  }
}

/*
  Sort a list of candidates by party, with Dems always first and GOP always last
*/

export function sortByParty(a, b) {
  var getPartyValue = c =>
    c.party == "GOP" || c.party == "No"
      ? Infinity
      : c.party == "Dem" || c.party == "Yes"
      ? -Infinity
      : c.party
      ? c.party.charCodeAt(0)
      : 0;

  return getPartyValue(a) - getPartyValue(b);
}

export function isSameCandidate(c1, c2) {
  return c1.last == c2.last && c1.party == c2.party;
}

/*
  Sort a list of candidates by a predefined order
*/
export function sortByOrder(a, b, order) {
  var getPartyValue = c => {
    if (!order.includes(c)) {
      return Infinity;
    }
    return order.indexOf(c);
  };

  return getPartyValue(a) - getPartyValue(b);
}

/*
  Text formatting functions, collected in a single object
  Use `chain(a, b, c)` to combine formatters as `c(b(a(value)))`
*/
export var formatters = {
  titleCase: v => v.replace(/(\b\w)/g, s => s.toUpperCase()),
  percent: v => Math.round(v * 100) + "%",
  comma: v => (v * 1).toLocaleString(),
  dollars: v => "$" + v,
  chain: function (formats) {
    return value => formats.reduce((v, fn) => fn(v), value);
  },
  percentDecimal: v => (v * 100).toFixed(1) + "%",
  voteMargin: function (result) {
    var prefix = getPartyPrefix(result.party);

    return prefix + " +" + Math.round(result.margin * 100);
  },
};

export function getPartyPrefix(party) {
  let prefix;
  if (party === "Dem") {
    prefix = "D";
  } else if (party === "GOP") {
    prefix = "R";
  } else if (party == "Other") {
    prefix = "O";
  } else {
    prefix = "I";
  }
  return prefix;
}

export function getBucket(rating) {
  if (rating == "solid-d" || rating == "likely-d") {
    return "likelyD";
  } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
    return "tossup";
  } else if (rating == "solid-r" || rating == "likely-r") {
    return "likelyR";
  }
}

export function getParty(party) {
  if (["Dem", "GOP", "Other", "No", "Yes"].includes(party)) {
    return party;
  }
  return "Ind";
}

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

export function groupCalled(results) {
  var called = {
    Dem: [],
    GOP: [],
    Other: [],
    uncalled: [],
  };

  if (results) {
    results.forEach(r => called[r.called ? r.winnerParty : "uncalled"].push(r));
  }

  return called;
}

export var sumElectoral = list => list.reduce((t, r) => t + r.electoral, 0);

export function styleJSX(styles) {
  var list = [];
  for (var k in styles) {
    var name = k.replace(/(a-z)(A-Z)/, (_, a, b) => `${a}-${b.toLowerCase()}`);
    var value = styles[k];
    list.push(`${name}: ${value}`);
  }
  return list.join("; ");
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

export var winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>`;
