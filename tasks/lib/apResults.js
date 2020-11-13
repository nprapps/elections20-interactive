var axios = require("axios");
var fs = require("fs").promises;
var depths = require("./depths");
var crypto = require("crypto");

var etags = {};

var resultsURL = "https://api.ap.org/v2/elections/";
var resultsParams = {
  apikey: process.env.AP_API_KEY,
  format: "JSON",
  avotes: true
};

var apDate = function(d) {
  var [m, d, y] = d.split("/");
  return [
    y,
    m.padStart(2, "0"),
    d.padStart(2, "0")
  ].join("-");
};

var issueTickets = function(races) {
  // build a list of "tickets" - API requests that will satisfy the races we want
  var tickets = [];
  // races that have their own ID need their own ticket
  var specific = races.filter(r => r.ids.length);

  // this loop is a little weird since the loop is also a filter
  while (specific.length) {
    var r = specific.shift();

    // find and add races with the same state/date/level
    var similar = [];
    specific = specific.filter(function(p) {
      if (p == r) return;
      if (p.state == r.state && p.date == r.date) {
        var rHouse = r.office == "H";
        var pHouse = p.office == "H";
        if (rHouse == pHouse) {
          similar.push(...p.ids);
          return false;
        }
      }
      return true;
    });

    tickets.push({
      date: apDate(r.date),
      params: {
        raceID: [...new Set(r.ids.concat(similar))].join(","),
        statePostal: r.state,
        level: r.office == "H" ? "state" : "FIPScode"
      }
    });
  }

  // split into at least two sets of tickets, based on geographic specificity
  // only house races do not use county results
  var generic = races.filter(r => !r.ids.length);
  var stateLevel = generic.filter(r => r.office == "H");
  var countyLevel = generic.filter(r => r.office != "H");

  [stateLevel, countyLevel].forEach(function(list, requestCounties) {
    // group races by date
    var byDate = {};
    list.forEach(function(r) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });
    // issue tickets for each day's combo of items
    for (var d in byDate) {
      var date = apDate(d);
      var list = byDate[d];
      var states = [].concat(...list.map(r => r.states));
      var offices = list.map(r => r.ap || r.office);
      tickets.push({
        date,
        params: {
          level: requestCounties ? "FIPScode" : "state",
          statePostal: [...new Set(states)].join(","),
          officeID: [...new Set(offices)].join(",")
        }
      });
    }
  });
  return tickets;
};

var redeemTicket = async function(ticket, options) {
  var tag =
    ticket.date +
    "_" +
    Object.keys(ticket.params)
      .sort()
      .map(p => `${p}=${ticket.params[p]}`)
      .join("&");
  var md5 = crypto.createHash("md5");
  var file = md5.update(tag).digest("hex");
  if (options.offline) {
    try {
      var json = await fs.readFile(`temp/${file}.json`);
      var data = JSON.parse(json);
      console.log(`Loaded offline data from temp/${file}.json`);
      return data;
    } catch(err) {
      console.log(`Couldn't load data for tag ${file} - does the file exist?`);
      // throw err;
    }
  } else {
    var headers = {};
    if (etags[tag]) headers["If-None-Match"] = etags[tag];
    try {
      var flags = {};
      if (options.test) flags.test = true;
      if (options.zero) flags.setZeroCounts = true;
      var response = await axios({
        url: resultsURL + ticket.date,
        params: Object.assign({}, resultsParams, ticket.params, flags),
        headers,
        validateStatus: status => status == 200 || status == 304
      });
      console.log(`Loaded API data for ${tag}`);
      if (response.status == 304) {
        console.log(`No change since last request for ${tag}`);
        var proxyOptions = Object.assign({}, options, { offline: true });
        var data = await redeemTicket(ticket, proxyOptions);
        return data;
      }
      var data = response.data;
      await fs.mkdir("temp", { recursive: true });
      await fs.writeFile(`temp/${file}.json`, JSON.stringify(data, null, 2));
      etags[tag] = response.headers.etag;
      return data;
    } catch (err) {
      console.log(err);
      // throw err;
    }
  }
}

module.exports = { issueTickets, redeemTicket, apDate };
