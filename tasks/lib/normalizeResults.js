/*

Builds an array of normalized races from an array of multiple API responses.
Also sets overrides for candidate/race metadata, and applies winner overrides.

*/

var ROUNDING = 10000;
var MERGE_THRESHOLD = .05;

var nprDate = apDate => {
  var [y, m, d] = apDate.split("-").map(parseFloat);
  return [m, d, y].join("/");
};

// candidates to always keep in results
var NEVER_MERGE = new Set(["8639", "1036"]);

var translation = {
  race: {
    test: "test",
    id: "raceID",
    office: "officeID",
    party: "party",
    eevp: "eevp",
    type: "raceType",
    seatNumber: "seatNum",
    seat: "seatName",
    description: "description",
  },
  unit: {
    level: "level",
    state: "statePostal",
    fips: "fipsCode",
    electoral: "electTotal",
    updated: "lastUpdated",
    name: "reportingunitName",
    reporting: "precinctsReporting",
    precincts: "precinctsTotal",
    eevp: "eevp",
  },
  candidate: {
    first: "first",
    last: "last",
    party: "party",
    id: "polID",
    votes: "voteCount",
    avotes: "avotes",
    electoral: "electWon",
    winner: "winner",
    incumbent: "incumbent",
  },
  metadata: {
    previousParty: "party",
    keyRace: "key_race",
    rating: "rating",
    seat: "name",
    featured: "featured",
    theme: "theme"
  }
};

var translate = {};

Object.keys(translation).forEach(type => {
  translate[type] = function (input) {
    var output = {};
    for (var [k, v] of Object.entries(translation[type])) {
      if (v in input) {
        output[k] = input[v];
      }
    }
    return output;
  };
});

var majorParties = new Set(["GOP", "Dem"]);
var sortCandidates = function (votes, candidates) {
  var compare = function (a, b) {
    // if no votes yet
    if (votes == 0) {
      // put major parties first
      if (
        (majorParties.has(a.party) && majorParties.has(b.party)) ||
        a.party == b.party
      ) {
        return a.last < b.last ? -1 : 1;
      } else {
        // one of them is not GOP/Dem
        if (majorParties.has(a.party)) {
          return -1;
        }
        return 1;
      }
    } else {
      // sort strictly on votes
      return b.votes - a.votes;
    }
  };
  candidates.sort(compare);
};

var mergeOthers = function (candidates, raceID) {
  // always take the top two
  var total = candidates.reduce((total, c) => total + c.votes, 0);
  var merged = candidates.slice(0, 2);
  var remaining = candidates.slice(2);
  var other = {
    first: "",
    last: "Other",
    party: "Other",
    id: `other-${raceID}`,
    votes: 0,
    avotes: 0,
    electoral: 0,
    count: remaining.length,
  };
  
  for (var c of remaining) {
    // preserve candidates with >N% of the vote
    if (c.votes / total > MERGE_THRESHOLD || NEVER_MERGE.has(c.id)) {
      merged.push(c);
      continue;
    }
    other.votes += c.votes || 0;
    other.avotes += c.avotes || 0;
    other.electoral += c.electoral || 0;
    if (c.winner) {
      other.winner = c.winner;
    }
  }
  merged.push(other);
  return merged;
};

module.exports = function (resultArray, overrides = {}) {
  // AP data is structured as race->reportingunits, where each "race" includes both state and FIPS
  // we will instead restructure into groupings by geography
  var output = [];

  var { calls = [], candidates = {}, rosters = {}, states = {} } = overrides;

  var nprMetadata = {
    H: overrides.house,
    S: overrides.senate,
    G: overrides.governors,
    I: overrides.ballot_measures,
  };

  for (var response of resultArray) {
    for (var race of response.races) {
      var raceMeta = translate.race(race);

      // early races may not have reporting units yet
      if (!race.reportingUnits) continue;

      for (var unit of race.reportingUnits) {
        var level = unit.level == "FIPSCode" ? "county" : unit.level;
        // do we have this race  at this level already?
        var unitMeta = {
          ...raceMeta,
          ...translate.unit(unit),
          level,
        };

        // normalize reporting data
        if (unitMeta.eevp) {
          unitMeta.eevp /= 100;
        }
        if (unitMeta.precincts) {
          unitMeta.reportingPercent = unitMeta.reporting / unitMeta.precincts;
        }

        // create a district property if necessary
        if (level == "district") {
          unitMeta.district =
            unitMeta.name == "At Large"
              ? "AL"
              : unitMeta.name.replace(/district /i, "");
        }

        // add the state name to states
        var stateKey = unitMeta.district && unitMeta.district != "AL" ? `${unitMeta.state}-${unitMeta.district}` : unitMeta.state;
        var stateMeta = states[stateKey];
        if (stateMeta) {
          unitMeta.stateName = stateMeta.name;
          unitMeta.stateAP = stateMeta.ap;
          unitMeta.rating = stateMeta.rating;
        }

        var sheetMetadata = (nprMetadata[raceMeta.office] || {})[raceMeta.id];
        if (sheetMetadata) {
          var meta = translate.metadata(sheetMetadata);
          Object.assign(unitMeta, meta);
          // For now, always override description with ours even if empty.
          unitMeta.description = sheetMetadata.description;
        }

        unitMeta.updated = Date.parse(unitMeta.updated);

        var total = 0;
        var parties = new Set();
        var ballot = unit.candidates.map(function (c) {
          c = translate.candidate(c);
          // assign overrides from the sheet by candidate ID
          var override = candidates[c.id];
          if (override) {
            for (var k in override) {
              if (override[k]) c[k] = override[k];
            }
            // console.log(
            //   `Applying candidate overrides for #${c.id} (${c.first} ${c.last})`
            // );
          }
          total += c.votes;
          parties.add(c.party);
          return c;
        });

        // override the ballot if necessary
        var roster = rosters[raceMeta.id];
        if (roster) {
          roster = new Set(roster.toString().split(/,\s*/));
          // console.log(
          //   `Overriding the roster for race #${unitMeta.id} - ${roster.size} candidates`
          // );
          ballot = ballot.filter(c => roster.has(c.id));
        }

        sortCandidates(total, ballot);

        // create "other" merged candidate if:
        // - More than two candidates and
        // - Independent candidate(s) exist and
        // - they're not marked as exceptions in a sheet
        // TODO: handle "jungle primary" races (LA and CA)
        if (!roster && ballot.length > 2 && unitMeta.level != "county") {
          ballot = mergeOthers(ballot, raceMeta.id);
        }

        var [call] = calls.filter(function (row) {
          if (row.raceID != unitMeta.id) return false;
          for (var p of ["state", "fips", "district"]) {
            if (row[p] && row[p] != unitMeta[p]) return false;
          }
          return true;
        });

        if (false && call) {
          console.log(
            `Overriding winner (${call.candidate}) for race #${
              unitMeta.id
            } in ${[call.state, call.fips, call.district]
              .filter(s => s)
              .join("-")}`
          );
        }

        var winner = null;
        ballot.forEach(function (c) {
          // assign percentages
          c.percent = Math.round((c.votes / total) * ROUNDING) / ROUNDING;
          if (call) {
            if (call.candidate == c.id) {
              c.winner = "X";
            } else {
              delete c.winner;
            }
          }
          if (c.winner == "X") winner = c;
          if (c.winner == "R") unitMeta.runoff = true;
        });

        // set the winner and called flags
        if (winner) {
          unitMeta.called = true;
          unitMeta.winnerParty = winner.party;
        }

        unitMeta.candidates = ballot;
        output.push(unitMeta);
      }
    }
  }

  return output;
};
