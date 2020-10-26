module.exports = function(response) {
  for (var race of response.races) {
    race.eevp = 0;
    if (!race.reportingUnits) continue;
    for (var ru of race.reportingUnits) {
      ru.precinctsReporting = 0;
      ru.precinctsReportingPct = 0;

      if (!ru.candidates) continue;
      for (var candidate of ru.candidates) {
        candidate.voteCount = 0;
        candidate.avotes = 0;
        delete candidate.winner;
        if ("electoral" in candidate) candidate.electoral = 0;
      }
    }
  }
}