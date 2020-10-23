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
    let prefix;
    if (result.party === "Dem") {
      prefix = "D";
    } else if (result.party === "GOP") {
      prefix = "R";
    } else {
      prefix = "I";
    }

    return prefix + " +" + Math.round(result.margin * 100);
  },
};

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
  if (["Dem", "GOP"].includes(party)) {
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
    name: "Covid Cases Per Capita",
    format: formatters.comma,
    last: true,
  },
  countyName: {
    name: "County",
    alpha: true,
    hideFromToggle: true,
  },
};

for (var k in availableMetrics) availableMetrics[k].key = k;

export function getCountyVariable(data, variable) {
  var value = data[variable];
  // Have to special case past margin.
  if (variable == "past_margin") {
    value = value.margin * (value.party == "Dem" ? 1 : -1);
  }
  return value * 1;
}

export { availableMetrics };

export function groupCalled(results) {
  var called = {
    Dem: [],
    GOP: [],
    uncalled: [],
  };

  if (results) {
    results.forEach(
      r => r.called && called[r.winnerParty || "uncalled"].push(r)
    );
  }

  return called;
}

export var sumElectoral = list => list.reduce((t, r) => t + r.electoral, 0);
