import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { calculatePrecinctsReporting } from "../util.js";

export class ResultsTableCandidates extends Component {
  constructor(props) {
    super();

    console.log(props.data);
    this.state = { data: props.data, tableClass: props.className };
  }

  render() {
    if (!this.state.data) {
      return "";
    }
    var results = this.state.data;
    const seatName = results.office === "H" ? results.seat : null;

    let totalVotes = 0;
    for (let i = 0; i < results.candidates.length; i++) {
      totalVotes += results.candidates[i].votes;
    }

    // TODO: check if the sorting removed here is still necessary
    // if (results.candidates.length > 2) {
    //   results.candidates = this.sortResults(results.candidates);
    // }

    return (
      <div class="results-table statewide">
        {seatName ? <caption> {seatName}</caption> : ""}
        <div
          class={
            "board " + (results.candidates.length < 2 ? "uncontested" : "")
          }
          role="table">
          <div class="thead results-header" role="rowgroup">
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
            {results.candidates.map((c, index) => this.renderRow(c, index))}
          </div>
        </div>
      </div>
    );
  }

  renderRow(result, index, mugshot = "") {
    var highest = index == 0;
    if (highest) {
      result.votes = 19876;
      result.percent = 0.75;
      result.winner = "X";
    }

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
            role="row">
            <div aria-hidden="true" class={`td flourishes ${(!mugshot ? "noimg" : "")}`}>
              <div
                class={"mugshot " + (!mugshot ? "noimg" : "")}
                style={`background-image: url( ${mugshot})`}></div>
              {result.votes ? (
                <div class="bar-container">
                  <div
                    class="bar"
                    style={`width:  ${
                      highest ? result.percent * 100 : 0
                    }%`}></div>
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
            </div>
            {this.state.data.candidates.length > 1 ? (
              <div role="cell" class="td percentage">
                {result.percent ? result.percent.toFixed(2) * 100 : "-"}
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
}
