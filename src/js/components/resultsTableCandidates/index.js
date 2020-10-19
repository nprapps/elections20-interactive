import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage } from "../util.js";
import "./results.less";
import strings from "strings.sheet.json";

export default function ResultsTableCandidates(props) {
  if (!props.data) {
    return "";
  }
  
  var results = props.data;
  var notStatewide = results.office === "H" || results.office === "I";
  var seatName = notStatewide ? results.seat : props.title;
  if (results.office === "I") seatName += ` - ${results.description}`

  let totalVotes = 0;
  for (let i = 0; i < results.candidates.length; i++) {
    totalVotes += results.candidates[i].votes;
  }

  var isUncontested = results.candidates.length < 2;
  var reporting = notStatewide
    ? `${reportingPercentage(props.data.reportingPercent || 0)}% reporting`
    : `${reportingPercentage(props.data.eevp || 0)}% in`;

  return (
    <div class="results-table statewide">
      <div class="results-header">
        {seatName ? <caption> {seatName}</caption> : <span />}
        <span class="reporting">{reporting}</span>
      </div>
      <div class={"board " + (isUncontested ? "uncontested" : "")} role="table">
        <div class="thead" role="rowgroup">
          <div class="tr" role="row">
            <div role="columnheader" class="th name" colspan="2">
              Candidate
            </div>
            <div role="columnheader" class="th percentage">
              Percent
            </div>
            <div role="columnheader" class="th votes">
              Votes
            </div>
          </div>
        </div>
        <div class="tbody" role="rowgroup">
          {results.candidates.map((c, index) => (
            <ResultsTableCandidatesRow key={c.id} data={c} uncontested={isUncontested} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResultsTableCandidatesRow(props) {
  var result = props.data;
  if (!result.votes && result.last == "Other") {
    return;
  }
  var mugshot;

  var classes = ["tr", "candidate", result.party || result.last];
  if (result.winner) classes.push("winner");
  if (result.incumbent) classes.push("incumbent");
  if (!mugshot) classes.push("noimg");
  var imgClass = mugshot ? "" : "noimg";

  return (
    <Fragment>
      <div class="row-wrapper" role="presentation">
        <div class={`${classes.join(" ")}`} role="row">
          <div aria-hidden="true" class={`td flourishes ${imgClass}`}>
            <div
              class={`"mugshot ${imgClass}`}
              style={`background-image: url( ${mugshot})`}></div>
            {result.votes ? (
              <div class="bar-container">
                <div
                  class="bar"
                  style={`width:  ${result.percent * 100 || 0}%`}></div>
              </div>
            ) : (
              ""
            )}
          </div>
          {CandidateNameCell(result)}
          {CandidateVoteCell(result, props.uncontested)}
          <div role="cell" class="td votes">
            {result.votes ? result.votes.toLocaleString() : "-"}
          </div>
        </div>
      </div>
      <div class="row-wrapper column-fixer" role="presentation"></div>
    </Fragment>
  );
}

function CandidateNameCell(candidate) {
  var name;
  if (candidate.last == "Other") {
    name = (
      <Fragment>
        <span>Other</span> <span class="first">Candidates</span>
      </Fragment>
    );
  } else {
    name = (
      <Fragment>
        {" "}
        <span class="first">{candidate.first || ""}</span> {candidate.last}{" "}
      </Fragment>
    );
  }

  var incumbent;
  if (candidate.incumbent) {
    incumbent = <span class="incumbent-icon"> &#9679;</span>;
  }

  var winner;
  if (candidate.winner) {
    winner = (
      <span class="winner-icon" role="img" aria-label="check mark">
        <svg
          aria-hidden="true"
          focusable="false"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512">
          <path
            fill="currentColor"
            d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
        </svg>
      </span>
    );
  }

  return (
    <div role="cell" class="td name">
      {name}
      {incumbent}
      {winner}
    </div>
  );
}

function CandidateVoteCell(candidate, uncontested) {
  if (uncontested) {
    return (
      <div role="cell" class="td votes uncontested" colspan="2">
        Uncontested
      </div>
    );
  }
  var candPercent = candidate.percent
    ? `${reportingPercentage(candidate.percent)}%`
    : "-";
  return (
    <div role="cell" class="td percentage">
      {candPercent}
    </div>
  );
}
