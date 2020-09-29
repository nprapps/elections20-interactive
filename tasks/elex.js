/*

Lots of flags available on this one:

--date=M/D/YYYY - pull data for this date (and the previous day)
  By default the rig will use today's date

--test - Ask the AP for test data

--offline - Use cached data if it exists

--archive - Set the "live" flag to false for all race JSON

*/

var { redeemTicket, apDate } = require("./lib/apResults");
var normalize = require("./lib/normalizeResults");
var fs = require("fs").promises;

module.exports = function(grunt) {

  var elex = {};

  var task = async function() {

    var test = grunt.option("test");
    var offline = grunt.option("offline");
    var live = !grunt.option("archive");

    // var overrides = {
    //   calls: grunt.data.json.calls,
    //   candidates: grunt.data.json.candidates
    // };

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

    var options = { test };

    var requests = tickets.map(t => redeemTicket(t, options));
    var rawResults = await Promise.all(requests);
    rawResults = rawResults.filter(r => r);
    var results = normalize(rawResults);

    // ensure the data folder exists
    await fs.mkdir("build/data", { recursive: true });

    // now create slices of various results
    // national results
    var national = results.filter(r => r.level == "national");
    await fs.writeFile("build/data/national.json", serialize(national));

    // state-level results
    var states = {};
    results.filter(r => r.level == "state").forEach(function(result) {
      var { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });
    for (var state in states) {
      await fs.writeFile(`build/data/state-${state}.json`, serialize(states[state]));
    }

    // county files
    await fs.mkdir("build/data/counties", { recursive: true });
    var countyRaces = {};
    results.filter(r => r.level == "county").forEach(function(result) {
      var { state, id } = result;
      var key = [state, id].join("-");
      if (!countyRaces[key]) countyRaces[key] = [];
      countyRaces[key].push(result);
    });
    for (var key in countyRaces) {
      await fs.writeFile(`build/data/counties/${key}.json`, serialize(countyRaces[key]));
    }

  }

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    task().then(done);
  });
};
