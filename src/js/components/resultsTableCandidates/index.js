import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { calculatePrecinctsReporting } from "../util.js";
import "./results.less";

export default function ResultsTableCandidates(props) {
  if (!props.data) {
    return "";
  }
  var results = props.data;
  const seatName = results.office === "H" ? results.seat : null;

  let totalVotes = 0;
  for (let i = 0; i < results.candidates.length; i++) {
    totalVotes += results.candidates[i].votes;
  }

  var isUncontested = results.candidates.length < 2;

  return (
    <div class="results-table statewide">
      <div class="results-header">
        {seatName ? <caption> {seatName}</caption> : ""}
        <span class="reporting">{props.data.eevp || 0}% in</span>
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
            <ResultsTableCandidatesRow
              data={c}
              uncontested={isUncontested}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResultsTableCandidatesRow(props) {
  var result = props.data;
  var mugshot;

  var classes = [];
  if (result.winner) classes.push("winner");
  if (result.incumbent) classes.push("incumbent");

  return (
    <Fragment>
      <div class="row-wrapper" role="presentation">
        <div
          class={`tr candidate ${result.party.toLowerCase()}  ${classes.join(
            " "
          )} ${mugshot ? "" : " noimg"}`}
          role="row"
        >
          <div
            aria-hidden="true"
            class={`td flourishes ${!mugshot ? "noimg" : ""}`}
          >
            <div
              class={"mugshot " + (!mugshot ? "noimg" : "")}
              style={`background-image: url( ${mugshot})`}
            ></div>
            {result.votes ? (
              <div class="bar-container">
                <div
                  class="bar"
                  style={`width:  ${result.percent * 100 || 0}%`}
                ></div>
              </div>
            ) : (
              ""
            )}
          </div>
          <div role="cell" class="td name">
            {result.last == "Other" ? (
              <Fragment>
                <span>Other</span> <span class="first">Candidates</span>
              </Fragment>
            ) : (
              <Fragment>
                {" "}
                <span class="first">{result.first || ""}</span> {result.last}{" "}
              </Fragment>
            )}
            {result.incumbent ? (
              <span class="incumbent-icon">&#9679;</span>
            ) : (
              ""
            )}
            {result.winner ? (
              <span class="winner-icon" role="img" aria-label="check mark">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"
                  ></path>
                </svg>
              </span>
            ) : (
              ""
            )}
          </div>
          {!props.uncontested ? (
            <div role="cell" class="td percentage">
              {result.percent ? (result.percent * 100).toFixed(1) + "%" : "-"}
            </div>
          ) : (
            <div role="cell" class="td votes uncontested" colspan="2">
              Uncontested
            </div>
          )}
          <div role="cell" class="td votes">
            {result.votes ? result.votes.toLocaleString() : "-"}
          </div>
        </div>
      </div>
      <div class="row-wrapper column-fixer" role="presentation"></div>
    </Fragment>
  );
}
