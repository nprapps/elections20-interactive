import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { reportingPercentage, getParty } from "../util.js";

const activeMugshots = {
  Biden:
    "https://apps.npr.org/dailygraphics/graphics/prez-candidates-jan-list-20190116/assets/joe_biden.png",
  Trump:
    "https://apps.npr.org/dailygraphics/graphics/prez-candidates-jan-list-20190116/assets/donald_trump.png",
};

export default function ResultsTableCandidates(props) {
  if (!props.data) {
    return "";
  }

  var results = props.data;
  var notStatewide = results.office === "H" || results.office === "I";
  var seatName = notStatewide ? results.seat : props.title;
  // if (results.office === "I" && results.description)
  //   seatName += ` - ${results.description}`;

  let totalVotes = 0;
  for (let i = 0; i < results.candidates.length; i++) {
    totalVotes += results.candidates[i].votes;
  }

  var isUncontested = results.candidates.length < 2;
  var reporting = `${reportingPercentage(
    (notStatewide ? props.data.reportingPercent : props.data.eevp) || 0
  )}% in`;

  var hasMugs = results.candidates.some(c =>
    Object.keys(activeMugshots).includes(c.last)
  );

  var footnote;
  var uncontestedText = isUncontested ? (
    <div class="footnote uncontested">
      The AP does not tabulate votes for uncontested races and declares its
      winner as soon as polls close.
    </div>
  ) : (
    ""
  );
  var hasIncumbent = results.candidates.some(c => c.incumbent);
  var incumbentText = hasIncumbent ? <div>● - Incumbent</div> : "";

  var ballot = results.office == "I";
  var house = results.office == "H";

  return (
    <div class={"results-table statewide " + (ballot ? "ballot" : "") + (house ? "house" : "")}>
      {seatName && (
        <div class="results-header">
          <caption> {seatName} <span class="state-label">- {results.stateName}</span> </caption>
        </div>
      )}
      <div class={"board " + (isUncontested ? "uncontested" : "")} role="table">
        <div class="thead" role="rowgroup">
          <div class="tr" role="row">
            <div role="columnheader" class="th name" colspan="2">
              {ballot ? "Option" : "Candidate"}
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
            <ResultsTableCandidatesRow
              key={c.id}
              data={c}
              uncontested={isUncontested}
              mugs={hasMugs}
              office={results.office}
            />
          ))}
        </div>
      </div>
      <div class="footnote">
        <span class="left">{incumbentText}</span>
        <span class="right">{isUncontested ? "" : reporting}</span>
      </div>
      {uncontestedText}
    </div>
  );
}

export function ResultsTableCandidatesRow(props) {
  var result = props.data;
  if (!result.votes && result.last == "Other") {
    return;
  }
  var mugshot = activeMugshots[result.last];

  var classes = ["tr", "candidate", getParty(result.party)];
  if (result.winner == "X") classes.push("winner");
  if (result.incumbent) classes.push("incumbent");
  if (!props.mugs) classes.push("noimg");
  var imgClass = mugshot ? "" : "noimg";

  return (
    <Fragment>
      <div class="row-wrapper" role="presentation">
        <div class={`${classes.join(" ")}`} role="row">
          <div
            aria-hidden="true"
            class={`td flourishes ${props.mugs ? "" : imgClass}`}>
            <div
              class={`mugshot ${imgClass}`}
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
          {CandidateNameCell(result, props.office)}
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

function CandidateNameCell(candidate, office) {
  var name;
  if (candidate.last == "Other") {
    name = <span>Other Candidates</span>;
  } else {
    name = (
      <Fragment>
        <span class="first">{candidate.first || ""}</span> {candidate.last}
        {office === "I" ? "" : ` (${getParty(candidate.party)}) `}
      </Fragment>
    );
  }

  var incumbent;
  if (candidate.incumbent) {
    incumbent = <span class="incumbent-icon"> &#9679;</span>;
  }

  var winner;
  if (candidate.winner == "X") {
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
  } else if (candidate.winner == "R") {
    winner = <span class="runoff-text"> - runoff</span>;
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
    ? `${Math.round(candidate.percent*1000)/10}%`
    : "-";
  return (
    <div role="cell" class="td percentage">
      {candPercent}
    </div>
  );
}
