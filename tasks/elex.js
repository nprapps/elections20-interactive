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

    var tickets = [
      // national results down to counties
      { date: "2020-11-03", 
        params: {
          level: "FIPScode",
          officeID: "P"
        }
      }
    ];

    var options = { test };

    var requests = tickets.map(t => redeemTicket(t, options));
    var rawResults = await Promise.all(requests);
    rawResults = rawResults.filter(r => r);
    var results = normalize(rawResults);

    await fs.writeFile("test.json", serialize(results));

    //group tickets by reporting unit, then by office, then by state

  }

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    task().then(done);
  });
};
