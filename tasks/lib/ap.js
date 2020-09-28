var { issueTickets, redeemTicket } = require("./apResults");
var normalizeResults = require("./normalizeResults");
var reports = require("./apReports");

/*

When loading AP data, we don't want to be rate-limited, so we want to make as
few requests as possible. However, we also want to spend the minimum amount of
time downloading and processing data, so we want the responses to be narrow.
To balance this, we use a three-step system:

1. We feed the list of desired races to the issueTickets() function, which
sorts them into groups and produces "tickets" for individual API requests.
These are balanced to provide the minimum number of tickets that will satisfy
our requirements.

2. Each ticket is "redeemed" for data. If the rig is running in offline mode,
or it gets a 304 from the API (meaning no results have changed since the last
request), it will attempt to load from the cache files in /temp.

3. normalizeResults() takes the AP responses, which are often quite a bit more
verbose and complex than we need them to be, and turns them into a flat array
of parsed race objects. This can then be used by the calling function to
assign them to output data files or apply them to templates.

*/

var getResults = async function(options) {
  var { test, offline, races } = options;
  var tickets = issueTickets(races);
  // console.log(`${tickets.length} tickets issued for AP data`);
  var rawResults = [];
  var redeemed = tickets.map(ticket => redeemTicket(ticket, options));
  var rawResults = await Promise.all(redeemed);
  rawResults = rawResults.filter(r => r);
  return normalizeResults(rawResults, options.overrides);
};

module.exports = { getResults, ...reports };
