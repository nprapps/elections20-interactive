/*

Lots of flags available on this one:

--date=M/D/YYYY - pull data for this date (and the previous day)
  By default the rig will use today's date

--test - Ask the AP for test data

--offline - Use cached data if it exists

--archive - Set the "live" flag to false for all race JSON

*/

var api = require("./lib/ap");
var depths = require("./lib/depths");
var moment = require("moment-timezone");

var TIMESPAN = 3;

var monthLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var inDays = function(dateString) {
  var [m, d, y] = dateString.split("/").map(Number);
  var days = 0;
  for (var i = 0; i < m - 1; i++) {
    days += monthLengths[i];
  }
  days += d;
  return days;
}

var inDates = function(days) {
  var m = 0;
  while (days) {
    if (days <= monthLengths[m]) {
      return `${m + 1}/${days}/2020`;
    }
    days -= monthLengths[m++];
  }
}

var ET = "America/New_York";
moment.tz.setDefault(ET);

var reportMod = 0;

module.exports = function(grunt) {

  var elex = {};

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    // get today's day index
    var today = inDays(moment().format("MM/DD/YYYY"));
    var date = grunt.option("date");
    if (date) {
      // date is provided
      var today = inDays(date);
    }
    // subtract 2 from the day index
    var retroactive = today - TIMESPAN;
    console.log(`Filtering races between ${inDates(retroactive)} and ${inDates(today)}`);

    var schedule = grunt.data.json.races.filter(r => r.office != "R");
    var latest = 0;
    schedule.forEach(function(r) {
      // assign a timestamp
      var [m, d, y] = r.date.split("/");
      r.days = inDays(r.date);
      if (r.displayDate) {
        r.displayDays = inDays(r.displayDate);
      }
      if (r.days < today && r.days > latest) latest = r.days;
      r.timestamp = moment(r.date, "MM/DD/YYYY").toDate();
      // split race IDs
      r.ids = r.raceID ? r.raceID.toString().split(/,\s*/g) : [];
      // split states
      r.states = r.state.split(/,\s*/g);
    });

    var races = schedule.filter(r => r.days <= today && r.days >= retroactive);

    // find the most recent race and run back if nothing was found
    if (!races.length && !date) {
      console.log("No current races found, falling back to most recent...");
      if (latest) {
        races = schedule.filter(r => r.days <= latest && r.days >= latest - TIMESPAN);
      }
    }

    races.push(...schedule.filter(r => r.alwaysRun && races.indexOf(r) == -1));

    console.log(`Found races: ${races.length ? races.map(r => r.filename).join(", ") : "none"}`);

    var test = grunt.option("test");
    var offline = grunt.option("offline");
    var live = !grunt.option("archive");
    var overrides = {
      calls: grunt.data.json.calls,
      candidates: grunt.data.json.candidates
    };

    var states = [...new Set(schedule.flatMap(r => r.states))].sort();

    // save some of this data for the build task
    grunt.data.elex = {
      schedule,
      races,
      today,
      retroactive,
      states
    };

    api
      .getResults({ races, overrides, test, offline })
      .then(async function(results) {

        var unmatched = [];

        races.forEach(function(contest) {
          var { states, office, date, ids, stateOnly, filename } = contest;

          var fromAP = results.filter(function(result) {
            if (ids.length) {
              // console.log(result.id);
              return ids.indexOf(result.id) > -1;
            }
            // filter out third-parties
            if (result.party && !result.party.match(/Dem|GOP/)) return false;
            return result.office == office &&
              states.indexOf(result.state) > -1 &&
              result.date == date;
          });
          if (!fromAP.length) {
            return unmatched.push(contest);
          }

          var subsetResults = function(geo = "state") {
            var copyKeys = "id eevp type party seat".split(" ");
            return fromAP.map(function(race) {
              var copy = {};
              for (var k in race) copy[k] = race[k];
              copy.results = race.results[geo];
              return copy;
            });
          }

          var stateResults = {
            test,
            caucus: contest.caucus,
            closing: contest.closing,
            chatter: contest.chatter,
            footnote: contest.footnote,
            special: contest.special,
            general: contest.general,
            runoff: contest.runoff,
            races: subsetResults("state")
          };

          // console.log(`Generating results: ${filename}.json`)
          grunt.file.write(`build/data/${filename}.json`, serialize(stateResults));

          if (office != "H" && !stateOnly) {
            var countyResults = {
              test,
              closing: contest.closing,
              chatter: contest.chatter,
              footnote: contest.footnote,
              races: subsetResults("county")
            };
            // add county name from the FIPS table
            countyResults.races.forEach(function(race) {
              race.results.forEach(function(result) {
                var county = grunt.data.json.fips[result.fips];
                if (county) {
                  result.county = county.name;
                  result.population = county.population;
                }
              })
            });
            // console.log(`Generating county results: ${filename}_counties.json`)
            grunt.file.write(`build/data/${filename}_counties.json`, serialize(countyResults));
          }

        });

        if (unmatched.length) {
          var dates = [...new Set(unmatched.map(r => r.date))];
          console.log("AP data not found for: ");
          dates.sort().forEach(function(d) {
            var missing = unmatched.filter(r => r.date == d).map(r => [r.state, r.office].join("-"));
            console.log(`  > ${d} - ${missing.join(", ")}`)
          })
        }

        // load delegate report for today
        // run with --results-only to skip
        if (grunt.option("results-only")) return;
        var now = new Date();
        var delegateFile = ["delegates", now.getMonth() + 1, now.getDate(), now.getFullYear()].join("_");
        var report = await api.getDelegates();
        var reportJSON = serialize(report);
        grunt.file.write(`build/data/${delegateFile}.json`, reportJSON);
        grunt.file.write("build/data/delegates.json", reportJSON);
      })
      .then(done)
      .catch(err => console.log(err));
  });
};
