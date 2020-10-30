/*

--test - Ask the AP for test data

--offline - Use cached data if it exists

*/

var { redeemTicket, apDate } = require("./lib/apResults");
var normalize = require("./lib/normalizeResults");
var nullify = require("./lib/nullifyResults");
var augment = require("./lib/augmentResults");
var fs = require("fs").promises;

module.exports = function(grunt) {

  var elex = {};

  // Grunt doesn't like top-level async, so define this here and call it immediately
  var task = async function() {

    var test = grunt.option("test");
    var offline = grunt.option("offline");
    var zero = grunt.option("zero");

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
    var rawResults = [];
    for (var t of tickets) {
      var response = await redeemTicket(t, { test, offline });
      if (!response) continue;
      // filter state results out of district requests
      if (t.params.level == "district") {
        response.races.forEach(function(race) {
          if (!race.reportingUnits) return;
          race.reportingUnits = race.reportingUnits.filter(u => u.level == "district");
        });
      }
      if (zero) nullify(response);
      rawResults.push(response);
    }
    // turn AP into normalized race objects
    var results = normalize(rawResults, grunt.data.json);

    // filter generator for district-based EC votes
    var stateOrDistrictFilter = function(level) {
      return function(result) {
        if (result.id != "0") return true;
        if (result.state == "ME" || result.state == "NE") {
          return result.level == level;
        }
        return true;
      }
    }

    grunt.log.writeln("Merging in external data...");
    augment(results, grunt.data);

    var { longform } = grunt.data.archieml;

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
    geo.state.filter(stateOrDistrictFilter("state")).forEach(function(result) {
      var { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });
    for (var state in states) {
      var stateOutput = {
        test,
        results: states[state]
      };
      var stateChatter = longform.statePages[state.toLowerCase()];
      if (stateChatter) {
        stateOutput.chatter = grunt.template.renderMarkdown(stateChatter);
      }
      await fs.writeFile(`build/data/states/${state}.json`, serialize(stateOutput));
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
      president: geo.state.filter(r => r.office == "P").filter(stateOrDistrictFilter("district")),
      house: geo.state.filter(r => r.office == "H"),
      senate: geo.state.filter(r => r.office == "S"),
      gov: geo.state.filter(r => r.office == "G"),
      ballots: geo.state.filter(r => r.office == "I" && r.featured)
    }

    for (var office in byOffice) {
      var officeOutput = {
        test,
        results: byOffice[office]
      }
      if (longform.chamberAlerts && longform.chamberAlerts[office]) {
        officeOutput.alert = grunt.template.renderMarkdown(longform.chamberAlerts[office]);
      }
      await fs.writeFile(`build/data/${office}.json`, serialize(officeOutput));
    }

    // create BOP widget output
    var mapBOP = function(r) {
      return {
        id: r.id,
        state: r.state,
        district: r.district,
        winner: r.winnerParty,
        electoral: r.electoral,
        previous: r.previousParty
      }
    }

    var latest = [].concat(
      geo.national,
      byOffice.house,
      byOffice.senate
    ).reduce((t, r) => Math.max(t, r.updated), 0);

    var bop = {
      president: byOffice.president.filter(r => r.called).map(mapBOP),
      house: byOffice.house.filter(r => r.called).map(mapBOP),
      senate: byOffice.senate.filter(r => r.called).map(mapBOP),
      latest
    }

    await fs.writeFile(`build/data/bop.json`, serialize(bop));

  }

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function() {
    grunt.task.requires("json");
    grunt.task.requires("csv");

    var done = this.async();

    task().then(done);
  });
};
