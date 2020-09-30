/*

--test - Ask the AP for test data

--offline - Use cached data if it exists

*/

var { redeemTicket, apDate } = require("./lib/apResults");
var normalize = require("./lib/normalizeResults");
var fs = require("fs").promises;

module.exports = function(grunt) {

  var elex = {};

  // Grunt doesn't like top-level async, so define this here and call it immediately
  var task = async function() {

    var test = grunt.option("test");
    var offline = grunt.option("offline");

    // probably move this into a sheet to be safe
    // also, should we use the ticket merging system?
    var tickets = [{
        date: "2020-11-03",
        params: {
          officeID: "P,G,S",
          level: "FIPSCode"
        }
      },
      {
        date: "2020-11-03",
        params: {
          officeID: "H,I",
          level: "state"
        }
      }
    ];

    // get results from AP
    var requests = tickets.map(t => redeemTicket(t, { test, offline}));
    var rawResults = await Promise.all(requests);
    // remove empty responses
    rawResults = rawResults.filter(r => r);
    // turn AP into normalized race objects
    var results = normalize(rawResults, grunt.data.json);

    // merge in per-county census/historical data
    results.forEach(function(r) {
      if (!r.fips) return;
      // get the winner from the previous election
      var prior = grunt.data.csv.prior_results
        .filter(p => p.fipscode == r.fips)
        .sort((a, b) => b.votepct - a.votepct)
        .slice(0, 2)
        .map(function(r) {
          return {
            last: r.last,
            party: r.party,
            percent: r.votepct * 1
          }
        });
      // TODO: add census/unemployment data
      r.county = { prior };
    });

    // ensure the data folder exists
    await fs.mkdir("build/data", { recursive: true });

    // now create slices of various results
    // separate by geography for easier grouping
    var geo = {
      national: results.filter(r => r.level == "national"),
      state: results.filter(r => r.level == "state"),
      county: results.filter(r => r.level == "county")
    };

    // national results
    await fs.writeFile("build/data/national.json", serialize(geo.national));

    // state-level results
    await fs.mkdir("build/data/states", { recursive: true });
    var states = {};
    geo.state.forEach(function(result) {
      var { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });
    for (var state in states) {
      await fs.writeFile(`build/data/states/${state}.json`, serialize(states[state]));
    }

    // county files
    await fs.mkdir("build/data/counties", { recursive: true });
    var countyRaces = {};
    geo.county.forEach(function(result) {
      var { state, id } = result;
      var key = [state, id].join("-");
      if (!countyRaces[key]) countyRaces[key] = [];
      countyRaces[key].push(result);
    });
    for (var key in countyRaces) {
      await fs.writeFile(`build/data/counties/${key}.json`, serialize(countyRaces[key]));
    }

    // sliced by office
    var byOffice = {
      president: geo.state.filter(r => r.office == "P"),
      house: geo.state.filter(r => r.office == "H"),
      senate: geo.state.filter(r => r.office == "S"),
      gov: geo.state.filter(r => r.office == "G"),
      ballots: geo.state.filter(r => r.office == "I")
    }

    for (var office in byOffice) {
      await fs.writeFile(`build/data/${office}.json`, serialize(byOffice[office]));
    }

  }

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    task().then(done);
  });
};