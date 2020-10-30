module.exports = function (results, data) {
  // build DB of external flags
  var flagged = {};
  if (data.json.flags)
    data.json.flags.forEach(function (row) {
      if (!flagged[row.raceID]) flagged[row.raceID] = [];
      flagged[row.raceID].push(row);
    });

  // merge in per-county census/historical data and flags
  results.forEach(function (r) {
    // add flags to races that match the filters in the sheet
    if (flagged[r.id]) {
      var matchingFlags = flagged[r.id].filter(function (f) {
        return f.fips ? f.fips == r.fips : f.state ? f.state == r.state : true;
      });
      if (matchingFlags.length) {
        r.flags = matchingFlags.map(f => f.flag);
      }
    }

    // Add electoral college winners to states
    if (r.id == 0 && (r.level == "state" || r.level == "district")) {
      var state16 = data.csv.prior_states
        .filter(s => s.votes * 1 && s.state == r.state)
        .sort((a, b) => b.votes - a.votes);

      if (r.level == "district") {
        state16 = state16.filter(s => s.district == r.district);
      } else {
        state16 = state16.filter(s => !s.district);
      }

      var candidates = state16.map(function (c) {
        return {
          last: c.last,
          party: c.party,
          electoral: c.votes,
        };
      });

      r.president16 = candidates;
      if (candidates.length) {
        r.previousParty = candidates[0].party;
      }
    } else {
      // remaining steps are county-specific
      if (!r.fips) return;

      // get the winner margin from the previous presidential election
      var past_margin = {};
      const [top, second] = data.csv.prior_fips
        .filter(p => p.fipscode == r.fips)
        .sort((a, b) => b.votepct - a.votepct)
        .slice(0, 2);
      past_margin.party = top.party;
      past_margin.margin = top.votepct - second.votepct;

      var census = data.csv.census_data[r.fips];
      var covid = data.csv.covid_county_cases[r.fips]
        ? (data.csv.covid_county_cases[r.fips] / census.population * 1000)
        : null;

      var bls = data.csv.unemployment_data[r.fips] || {};
      var { unemployment } = bls;

      var countyName = data.csv.county_names[r.fips] || "At large";

      r.county = { past_margin, ...census, unemployment, covid, countyName };
    }
  });

  return results;
};
