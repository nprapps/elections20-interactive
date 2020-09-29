/*

Builds an array of normalized races from an array of multiple API responses.
These are not yet grouped--it's just to compute subtotals and rename columns.
The calling task will need to create the lookup map from races to individual
race IDs.

*/

var depths = require("./depths");

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
    early: "avotes",
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

module.exports = function(resultArray, overrides = { calls: {}, candidates: {} }) {
  // AP data is structured as race->reportingunits, where each "race" includes both state and FIPS
  // we will instead restructure into groupings by geography
  var output = [];

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

        unitMeta.candidates = unit.candidates.map(translate.candidate);
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
