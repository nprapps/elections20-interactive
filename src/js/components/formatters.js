import { h } from "preact";

var apMonths = [
  "Jan.",
  "Feb.",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec."
];

export function DateFormatter(props) {
  var dateString = "...";

  if (props.value) {
    var date = new Date(props.value);
    var hours = date.getHours();
    if (!isNaN(hours)) { 
      var suffix = hours < 12 ? "AM" : "PM";
      if (!hours) {
        hours = 12;
      } else if (hours > 12) {
        hours -= 12;
      }
      var minutes = date.getMinutes().toString().padStart(2, "0");
      var month = apMonths[date.getMonth()];
      var day = date.getDate();
      var year = date.getFullYear();
      dateString = `${hours}:${minutes} ${suffix} on ${month} ${day}, ${year}`;
    }
  }
  return <span class="formatted-date">
    {dateString}
  </span>
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

export function getParty(party) {
  if (["Dem", "GOP", "Other", "No", "Yes"].includes(party)) {
    return party;
  }
  return "Ind";
}

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