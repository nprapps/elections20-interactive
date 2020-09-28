var axios = require("axios");
var fs = require("fs").promises;

var reportCache = {};

var endpoint = "https://api.ap.org/v2/reports";
var baseParams = {
  apiKey: process.env.AP_API_KEY,
  format: "json"
};

var getAPIData = async function(url, ...params) {
  var response = await axios({
    url,
    params: Object.assign({}, baseParams, ...params)
  });
  return response.data;
};

var processSuperReport = function(report) {
  var data = report.delSuper.del;
  var out = {
    updated: Date.parse(report.delSuper.timestamp),
    parties: {}
  }

  var normalizeState = function(state) {
    var data = {
      state: state.sId,
      candidates: state.Cand ? state.Cand.map(function(c) {
        return {
          name: c.cName,
          id: c.cId,
          delegates: c.dTot * 1,
          supers: c.sdTot * 1
        }
      }) : []
    }
    return data;
  }

  data.forEach(function(d) {
    var party = d.pId;
    var needed = d.dNeed * 1;
    var votes = d.dVotes * 1;

    var total = d.State.filter(s => s.sId == "US").pop();
    var states = d.State.filter(s => s.sId != "US");

    out.parties[party] = {
      needed, votes,
      total: normalizeState(total),
      states: states.map(normalizeState)
    }
  });

  return out;
};

var processSumReport = function(report) {
  var out = {
    updated: Date.parse(report.delSum.timestamp),
    parties: {}
  }

  report.delSum.del.forEach(function(d) {
    var party = d.pId;
    var needed = d.dNeed * 1;
    var votes = d.dVotes * 1;
    var chosen = d.dChosen * 1;
    var remaining = d.dToBeChosen * 1;

    out.parties[party] = {
      needed, votes, chosen, remaining,
      candidates: d.Cand ? d.Cand.map(function(c) {
        return {
          name: c.cName,
          id: c.cId,
          total: c.dTot * 1,
          day: c.d1 * 1,
          week: c.d7 * 1,
          month: c.d30 * 1
        }
      }) : []
    }
  });

  return out;
};

var processStateReport = function(report) {
  var out = {
    updated: Date.parse(report.delState.timestamp),
    parties: {}
  };

  report.delState.del.forEach(function(d) {
    var party = d.pId;
    var needed = d.dNeed;
    var votes = d.dVotes;

    out.parties[party] = {
      needed, votes,
      states: d.State.map(function(s) {
        return {
          state: s.sId,
          candidates: s.Cand ? s.Cand.map(function(c) {
            return {
              name: c.cName,
              id: c.cId,
              total: c.dTot * 1,
              day: c.d1 * 1
            }
          }) : []
        }
      })
    }
  });

  return out;
};

var getDelegates = async function(params = {}) {
  console.log("Getting report lookup file...");
  var links = await getAPIData(endpoint, params, { type: "delegates", geo: "US" });
  var output = {};
  var normalize = {
    delSuper: processSuperReport,
    delSum: processSumReport,
    delState: processStateReport
  }
  console.log("Getting reports...");
  var latest = {};
  links.reports.forEach(function(link) {
    var updated = Date.parse(link.updated);
    var [type, name] = link.title.split(/\s*\/\s*/g);
    name = name.replace("del", "");
    var url = link.id;
    if (latest[name]) {
      if (latest[name].updated > updated) return;
    }
    latest[name] = { updated, url };
  });
  var reports = Object.keys(latest).map(async function(name) {
    var link = latest[name];
    var { url } = link;
    var report;
    if (reportCache[url]) {
      console.log(`Getting report from cache (${url})`);
      report = reportCache[url];
    } else {
      console.log(`Loading report from AP (${url})`);
      report = reportCache[url] = await getAPIData(url, params)
    }
    for (var k in report) {
      var prop = k.replace(/del/, "").toLowerCase();
      var processed = normalize[k](report);
      output[prop] = processed;
    }
  });
  await Promise.all(reports);
  return output;
};

module.exports = { getDelegates }