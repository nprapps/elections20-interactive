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
  var getPartyValue = (c) =>
    c.party == "GOP" || c.party == "No"
      ? Infinity
      : c.party == "Dem" || c.party == "Yes"
      ? -Infinity
      : c.party ? c.party.charCodeAt(0) : 0;

  return getPartyValue(a) - getPartyValue(b);
}

/*
  Sort a list of candidates by party, with Dems always first and GOP always last
*/

export function sortByOrder(a, b, order) {
  var getPartyValue = (c) => {
    if (!order.includes(c.party)) {
      return Infinity
    }
    return order.indexOf(c.party)
  }

  return getPartyValue(a) - getPartyValue(b);
}

/*
  Text formatting functions, collected in a single object
  Use `chain(a, b, c)` to combine formatters as `c(b(a(value)))`
*/
export var formatters = {
  titleCase: (v) => v.replace(/(\b\w)/g, (s) => s.toUpperCase()),
  percent: (v) => Math.round(v * 100) + "%",
  comma: (v) => (v * 1).toLocaleString(),
  dollars: (v) => "$" + v,
  chain: function (formats) {
    return (value) => formats.reduce((v, fn) => fn(v), value);
  }
};
