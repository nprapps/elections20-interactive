import { h, Fragment } from "preact";

var sum = list => list.reduce((t, r) => t + r.electoral, 0);

function Leaderboard(props) {
  var { called } = props;

  return (
    <div class="leaderboard">
      <div class="results-header-group dem">
        <h2 class="party">
          <label>Biden</label>
          <abbr>{sum(called.Dem)}</abbr>
        </h2>
      </div>

      <div class="results-header-group gop">
        <h2 class="party">
          <label>Trump</label>
          <abbr>{sum(called.GOP)}</abbr>
        </h2>
      </div>

      <div class="results-header-group not-called">
        <h2 class="party">
          <label>Uncalled</label>
          <abbr>{sum(called.uncalled)}</abbr>
        </h2>
      </div>
    </div>
  );
}

export default function ElectoralArc(props) {
  var { results } = props;

  var called = {
    Dem: [],
    GOP: [], 
    uncalled: []
  };

  var wedges = {
    Dem: [],
    GOP: []
  }

  if (results) {
    results.forEach(r => called[r.winnerParty || "uncalled"].push(r));

    for (var k in wedges) {
      var counter 
      wedges[k] = called[k]
        .sort((a, b) => b.updated - a.updated)
        .map(function() {})
    }
  }

  return (<>
    <div class="electoral-arc">

      <Leaderboard called={called} />

    </div>

  </>);
}