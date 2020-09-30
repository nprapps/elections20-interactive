/*

Builds an array of normalized races from an array of multiple API responses.
These are not yet grouped--it's just to compute subtotals and rename columns.
The calling task will need to create the lookup map from races to individual
race IDs.

*/

var depths = require("./depths");

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
    description: "description"
  },
  unit: {
    level: "level",
    state: "statePostal",
    fips: "fipsCode",
    electoral: "electTotal",
    updated: "lastUpdated",
    reporting: "precinctsReporting",
    precincts: "precinctsTotal",
    eevp: "eevp"
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
    incumbent: "incumbent"
  }
}

var translate = {};

Object.keys(translation).forEach(type => {
  translate[type] = function(input) {
    var output = {};
    for (var [k, v] of Object.entries(translation[type])) {
      if (v in input) {
        output[k] = input[v];
      }
    }
    return output;
  };
});

module.exports = function(resultArray, overrides = {}) {
  // AP data is structured as race->reportingunits, where each "race" includes both state and FIPS
  // we will instead restructure into groupings by geography
  var output = [];

  var { calls = {}, candidates = {} } = overrides;

  for (var response of resultArray) {

    for (var race of response.races) {
      var raceMeta = translate.race(race);

      for (var unit of race.reportingUnits) {
        var level = unit.level == "FIPSCode" ? "county" : unit.level;
        // do we have this race  at this level already?
        var unitMeta = {
          ...raceMeta,
          ...translate.unit(unit),
          level
        }

        unitMeta.updated = Date.parse(unitMeta.updated);

        var call = overrides.calls[raceMeta.id];

        var total = 0;
        var parties = new Set();
        var candidates = unit.candidates.map(function(c) {
          c = translate.candidate(c);
          // TODO: assign overrides from the sheet by candidate ID
          total += c.votes;
          parties.add(c.party);
          return c;
        });

        // sort candidates
        var majorParties = new Set(["GOP", "Dem"]);
        candidates.sort(function(a, b) {
          // if no votes yet
          if (total == 0) {
            // put major parties first
            if (
              (majorParties.has(a.party) && majorParties.has(b.party)) ||
              a.party == b.party) 
            {
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
        });

        // create "other" merged candidate if:
        // - More than two candidates and 
        // - Independent candidate(s) exist and
        // - they're not marked as exceptions in a sheet (TODO)
        // TODO: handle "jungle primary" races (LA and CA)
        if (candidates.length > 2 && parties.size > 2) {
          // always take the top two
          var merged = candidates.slice(0, 2);
          var remaining = candidates.slice(2);
          var other = {
            first: "",
            last: "Other",
            party: "Other",
            id: `other-${raceMeta.id}`,
            votes: 0,
            avotes: 0,
            electoral: 0
          }
          for (var c of remaining) {
            other.votes += c.votes || 0;
            other.avotes += c.avotes || 0;
            other.electoral += c.electoral || 0;
            if (c.winner) {
              other.winner = c.winner;
            }
          }
          merged.push(other);
          candidates = merged;
        }

        candidates.forEach(function(c) {
          // assign percentages
          c.percent = Math.round((c.votes / total) * ROUNDING) / ROUNDING;
          if (call) {
            if (call == c.id) {
              c.winner = "X";
            } else {
              delete c.winner;
            }
          }
        });
        unitMeta.candidates = candidates;
        output.push(unitMeta);
      }

    }

  };

  /*
  TODO:
  - add metadata overrides and calls
  - think about how much processing should live in this layer
  */

  return output;

};
