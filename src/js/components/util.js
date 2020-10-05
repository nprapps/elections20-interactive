// TODO: make all of this easier to re-use in smaller chunks
// TODO: clean up shareable parts of getCleanedData and bring in here?
export function determineResults(race) {
  if (race.length === 1) {
    return { result1: race[0], uncontested: true };
  }

  let result1;
  let result2;

  // TODO: check switching away from loopArr didn't break anything
  for (var i = 0; i < race.length; i++) {
    var result = race[i];
    if ((result.party === 'Dem' || result.party === 'Yes') && !result1) {
      result1 = result;
    } else if (
      (result.party === 'GOP' || result.party === 'No') &&
      !result2
    ) {
      result2 = result;
    }

    if (result1 && result2) {
      break;
    }
  }

  // Handle when there're two candidates of one party, and
  // ensure that the same candidate isn't used twice
  if (!result1) {
    result1 = race.filter(r => !areCandidatesSame(r, result2))[0];
  } else if (!result2) {
    result2 = race.filter(r => !areCandidatesSame(r, result1))[0];
  }

  let sortedResults = [result1, result2];

  // If both candidates are GOP, put the leader on the right side
  // Otherwise, put the leader on the left side.
  if (result1.party === result2.party) {
    sortedResults = sortedResults.sort(function (a, b) {
      return sortedResults[0].party === 'GOP'
        ? a.votepct - b.votepct
        : b.votepct - a.votepct;
    });
  }

  return { result1: sortedResults[0], result2: sortedResults[1] };
}

export function decideLabel(race) {
  if (race.officename === 'U.S. House') {
    return race.statepostal + '-' + race.seatnum;
  } else if (
    race.officename === 'President' &&
    race.level === 'district' &&
    race.reportingunitname !== 'At Large'
  ) {
    return race.statepostal + '-' + race.reportingunitname.slice('-1');
  } else if (race.is_ballot_measure) {
    // The AP provides ballot measure names in inconsistent formats
    const splitName = race.seatname.split(' - ');
    const isHyphenatedMeasureName = Boolean(
      race.seatname.match(/^[A-Z\d]+-[A-Z\d]+ /)
    );

    if (splitName.length === 1 && !isHyphenatedMeasureName) {
      // Sometimes there's no identifier, such as: 'Legislative Pay'
      return `${race.statepostal}: ${race.seatname}`;
    } else if (splitName.length === 1 && isHyphenatedMeasureName) {
      // Sometimes there's a compound identifier, such as '18-1 Legalize Marijuana'
      const [number, ...identifierParts] = race.seatname.split(' ');
      const identifier = identifierParts.join(' ');
      return `${race.statepostal}-${number}: ${identifier}`;
    } else if (splitName.length === 2) {
      // Usually, there's an identifier with a ` - ` delimiter, eg:
      // 'S - Crime Victim Rights'
      // '1464 - Campaign Finance'
      return `${race.statepostal}-${splitName[0]}: ${splitName[1]}`;
    } else {
      console.error('Cannot properly parse the ballot measure name');
      return `${race.statepostal} - ${race.seatname}`;
    }
  } else {
    return race.statepostal;
  }
}

export function getMetaData(results) {
  const result1 = results.result1;
  const result2 = results.result2;

  let winningResult;
  if (result1.npr_winner || results.uncontested) {
    winningResult = result1;
  } else if (result2.npr_winner) {
    winningResult = result2;
  }

  if (winningResult) {
    var called = true;
  }

  if (
    winningResult &&
    result1.meta.current_party &&
    winningResult.party !== result1.meta.current_party
  ) {
    var change = true;
  }

  if (
    called ||
    result1.votecount > 0 ||
    (!results.uncontested && result2.votecount > 0)
  ) {
    var reporting = true;
  }

  return { winningResult, called, reporting, change };
}

export function calculatePrecinctsReporting(pct) {
  if (pct > 0 && pct < 0.005) {
    return '<1';
  } else if (pct > 0.995 && pct < 1) {
    return '>99';
  } else {
    return Math.round(pct * 100);
  }
}

export function getViewFromRace(race) {
  var viewMappings = {"P": "president", "S": "senate", "H": "house", "G": "governor"};
  return viewMappings[race]
}

// Helper functions
const areCandidatesSame = (c1, c2) =>
  c1.first === c2.first && c1.last === c2.last && c1.party === c2.party;
