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
          officeID: "P",
          level: "district"
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

    // remove state-level P results for ME and NE
    results = results.filter(function(r) {
      if (r.id != 0) return true;
      if (r.state == "ME" || r.state == "NE") {
        return r.level != "state";
      }
      return true;
    });

    grunt.log.writeln("Merging in external data...");

    // build DB of external flags
    var flagged = {};
    if (grunt.data.json.flags) grunt.data.json.flags.forEach(function(row) {
      if (!flagged[row.raceID]) flagged[row.raceID] = [];
      flagged[row.raceID].push(row);
    });

    // merge in per-county census/historical data and flags
    results.forEach(function(r) {

      // add flags to races that match the filters in the sheet
      if (flagged[r.id]) {
        var matchingFlags = flagged[r.id].filter(function(f) {
          return f.fips ? f.fips == r.fips :
            f.state ? f.state == r.state :
            true;
        });
        if (matchingFlags.length) {
          r.flags = matchingFlags.map(f => f.flag);
        }
      }


      // Add electoral college winners to states
      if (r.id == 0 && (r.level == "state" || r.level == "district")) {
        var state16 = grunt.data.csv.prior_states
          .filter(s => s.state == r.state)
          .sort((a, b) => b.votes - a.votes)
          .filter(s => s.votes)
          .map(function(c) {
            return {
              last: c.last,
              party: c.party,
              electoral: c.votes
            };
          });

        r.president16 = state16;
        r.previousParty = state16[0].party;

      } else {
        // remaining steps are county-specific
        if (!r.fips) return;

        // get the winner from the previous presidential election
        var president16 = grunt.data.csv.prior_fips
          .filter(p => p.fipscode == r.fips)
          .sort((a, b) => b.votepct - a.votepct)
          .slice(0, 2)
          .map(function(c) {
            return {
              last: c.last,
              party: c.party,
              percent: c.votepct * 1
            }
          });

        var census = grunt.data.csv.census_data[r.fips];

        var bls = grunt.data.csv.unemployment_data[r.fips] || {};
        var { unemployment } = bls;

        var countyName = grunt.data.csv.county_names[r.fips] || "At large";

        r.county = { president16, ...census, unemployment, countyName};

      }
    });

    grunt.log.writeln("Generating data files...");

    // ensure the data folder exists
    await fs.mkdir("build/data", { recursive: true });

    // now create slices of various results
    // separate by geography for easier grouping
    var geo = {
      national: results.filter(r => r.level == "national"),
      state: results.filter(r => r.level == "state" || r.level == "district"),
      county: results.filter(r => r.level == "county")
    };

    // national results
    await fs.writeFile("build/data/national.json", serialize({ test, results: geo.national }));

    // state-level results
    await fs.mkdir("build/data/states", { recursive: true });
    var states = {};
    geo.state.forEach(function(result) {
      var { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });
    for (var state in states) {
      await fs.writeFile(`build/data/states/${state}.json`, serialize({ test, results: states[state] }));
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
      await fs.writeFile(`build/data/counties/${key}.json`, serialize({ test, results: countyRaces[key] }));
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
      await fs.writeFile(`build/data/${office}.json`, serialize({ test, results: byOffice[office] }));
    }

    // top-level results fusion
    var gcu = grunt.data.archieml.longform.getCaughtUp;
    "headline text".split(" ").forEach(p => gcu[p] = grunt.template.renderMarkdown(gcu[p]));
    var top = {
      test,
      gcu,
      senate: [],
      house: [],
      president: [],
      gov: [],
      ballots: []
    };

    await fs.writeFile(`build/data/topResults.json`, serialize(top));

  }

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function() {
    grunt.task.requires("json");
    grunt.task.requires("csv");

    var done = this.async();

    task().then(done);
  });
};
