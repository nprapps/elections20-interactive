// TODO: make all of this easier to re-use in smaller chunks
// TODO: clean up shareable parts of getCleanedData and bring in here?
export function getLeadingCandidate(candidates) {
  var leading = null;
  var votes = 0;
  for (var c of candidates) {
    if (c.votes > votes) {
      leading = c.id;
      votes = c.votes;
    }
  }
  return leading;
}

export function decideLabel(race) {
  if (race.officename === "U.S. House") {
    return race.statepostal + "-" + race.seatnum;
  } else if (
    race.officename === "President" &&
    race.level === "district" &&
    race.reportingunitname !== "At Large"
  ) {
    return race.statepostal + "-" + race.reportingunitname.slice("-1");
  } else if (race.is_ballot_measure) {
    // The AP provides ballot measure names in inconsistent formats
    const splitName = race.seatname.split(" - ");
    const isHyphenatedMeasureName = Boolean(
      race.seatname.match(/^[A-Z\d]+-[A-Z\d]+ /)
    );

    if (splitName.length === 1 && !isHyphenatedMeasureName) {
      // Sometimes there's no identifier, such as: 'Legislative Pay'
      return `${race.statepostal}: ${race.seatname}`;
    } else if (splitName.length === 1 && isHyphenatedMeasureName) {
      // Sometimes there's a compound identifier, such as '18-1 Legalize Marijuana'
      const [number, ...identifierParts] = race.seatname.split(" ");
      const identifier = identifierParts.join(" ");
      return `${race.statepostal}-${number}: ${identifier}`;
    } else if (splitName.length === 2) {
      // Usually, there's an identifier with a ` - ` delimiter, eg:
      // 'S - Crime Victim Rights'
      // '1464 - Campaign Finance'
      return `${race.statepostal}-${splitName[0]}: ${splitName[1]}`;
    } else {
      console.error("Cannot properly parse the ballot measure name");
      return `${race.statepostal} - ${race.seatname}`;
    }
  } else {
    return race.statepostal;
  }
}

export function reportingPercentage(pct) {
  if (pct > 0 && pct < 0.005) {
    return "<1";
  } else if (pct > 0.995 && pct < 1) {
    return ">99";
  } else {
    return Math.round(pct * 100);
  }
}

// TODO: get this from strings.sheet.json instead
export function getViewFromRace(race) {
  var viewMappings = { P: "president", S: "senate", H: "house", G: "governor" };
  return viewMappings[race];
}

// Helper functions

export const toTitleCase = (str) =>
  str.replace(/(\b\w)/g, (g) => g.toUpperCase());
export const fmtComma = (s) => s.toLocaleString("en-US").replace(/\.0+$/, "");

export function cssClass(...names) {
  names = names.filter(n => n);
  return names.join(" ");
}