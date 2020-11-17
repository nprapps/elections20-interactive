/*
  Sort a list of candidates by party, with Dems always first and GOP always last
*/
export function sortByParty(a, b) {
  var getPartyValue = c =>
    c.party == "GOP" || c.party == "No"
      ? Infinity
      : c.party == "Dem" || c.party == "Yes"
      ? -Infinity
      : c.party
      ? c.party.charCodeAt(0)
      : 0;

  return getPartyValue(a) - getPartyValue(b);
}

/*
  Sort a list of candidates by a predefined order
*/
export function sortByOrder(a, b, order) {
  var getPartyValue = c => {
    if (!order.includes(c)) {
      return Infinity;
    }
    return order.indexOf(c);
  };

  return getPartyValue(a) - getPartyValue(b);
}

export function getBucket(rating) {
  if (rating == "solid-d" || rating == "likely-d") {
    return "likelyD";
  } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
    return "tossup";
  } else if (rating == "solid-r" || rating == "likely-r") {
    return "likelyR";
  }
}

export function groupCalled(results) {
  var called = {
    Dem: [],
    GOP: [],
    Other: [],
    uncalled: [],
  };

  if (results) {
    results.forEach(r => called[r.called ? r.winnerParty : "uncalled"].push(r));
  }

  return called;
}