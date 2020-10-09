/*

Builds an array of normalized races from an array of multiple API responses.
Also sets overrides for candidate/race metadata, and applies winner overrides.

*/

var ROUNDING = 10000;

var nprDate = apDate => {
  var [y, m, d] = apDate.split("-").map(parseFloat);
  return [m, d, y].join("/");
};

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

  var { calls = [], candidates = {}, rosters = {} } = overrides;

  var nprMetadata = {
    ...overrides.house,
    ...overrides.senate,
    ...overrides.governors
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

        var sheetMetadata = nprMetadata[raceMeta.id];
        unitMeta.previousParty = sheetMetadata ? sheetMetadata.party : null;
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
            console.log(`Applying candidate overrides for #${c.id} (${c.first} ${c.last})`);
          }
          total += c.votes;
          parties.add(c.party);
          return c;
        });

        // override the ballot if necessary
        var roster = rosters[raceMeta.id];
        if (roster) {
          roster = new Set(roster.toString().split(/,\s*/));
          console.log(`Overriding the roster for race #${unitMeta.id} - ${roster.size} candidates`);
          ballot = ballot.filter(c => roster.has(c.id));
        }

        sortCandidates(total, ballot);

        // create "other" merged candidate if:
        // - More than two candidates and
        // - Independent candidate(s) exist and
        // - they're not marked as exceptions in a sheet
        // TODO: handle "jungle primary" races (LA and CA)
        if (!roster && ballot.length > 2 && parties.size > 2) {
          ballot = mergeOthers(ballot, raceMeta.id);
        }

        var [ call ] = calls.filter(function(row) {
          if (row.raceID != unitMeta.id) return false;
          if (row.state && row.state != unitMeta.state) return false;
          if (row.fips && row.fips != unitMeta.fips) return false;
          return true;
        });

        if (call) console.log(`Overriding winner (${call.candidate}) for race #${unitMeta.id}`);

        var winners = new Set();
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
          if (c.winner) winners.add(c.winner);
        });

        // set the winner and runoff flags
        unitMeta.called = winners.has("X");
        unitMeta.runoff = winners.has("R");

        unitMeta.candidates = ballot;
        output.push(unitMeta);
      }
    }
  }

  return output;
};
