export { getAvailableMetrics, getCountyVariable, getCountyCandidates } from "./county_util.js";
export { formatters, DateFormatter, getPartyPrefix, getParty, reportingPercentage } from "./formatters.js"
export { sortByParty, sortByOrder, getBucket, groupCalled } from "./sorters.js"

export function styleJSX(styles) {
  var list = [];
  for (var k in styles) {
    var name = k.replace(/(a-z)(A-Z)/, (_, a, b) => `${a}-${b.toLowerCase()}`);
    var value = styles[k];
    list.push(`${name}: ${value}`);
  }
  return list.join("; ");
}

export function isSameCandidate(c1, c2) {
  return c1.last == c2.last && c1.party == c2.party;
}

export var sumElectoral = list => list.reduce((t, r) => t + r.electoral, 0);

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
