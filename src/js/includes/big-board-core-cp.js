// npm libraries
import { h, createProjector } from 'maquette';
import { buildDataURL } from './helpers.js';

var copyBop = window.copy.bop;

// global vars
let dataURL = null;
let bopDataURL = null;
let lastRequestTime = '';
let lastBopRequestTime = '';
let boardTitle = null;
let resultsData = null;
let bopData = null;
let lastUpdated = null;

const boardWrapper = document.querySelector('.board');
const projector = createProjector();
const coloredParties = ['Dem', 'GOP', 'Yes', 'No'];

/*
* Initialize the graphic.
*/
function initBigBoard (filename, boardName, boardClass) {
  boardTitle = boardName;
  boardWrapper.classList.add(boardClass);

  bopDataURL = buildDataURL('top-level-results.json');
  dataURL = buildDataURL(filename);
  projector.append(boardWrapper, renderMaquette);

  getBopData();
  getData();
  setInterval(getBopData, 5000);
  setInterval(getData, 5000);
}

const getData = function () {
  window.fetch(
    dataURL,
    { headers: { 'If-Modified-Since': lastRequestTime } }
  ).then(res => {
    if (res.status === 304) {
      // There is no body to decode in a `304` response
      return new Promise(() => null);
    } else if (res.ok) {
      return res.json();
    } else {
      throw Error(res.statusText);
    }
  }).then(res => {
    lastRequestTime = new Date().toUTCString();
    if (res) {
      resultsData = sortData(res.results);
      lastUpdated = res.last_updated;
      projector.scheduleRender();
    }
  }).catch(err =>
    console.warn(err)
  );
};

const getBopData = function () {
  window.fetch(
    bopDataURL,
    { headers: { 'If-Modified-Since': lastBopRequestTime } }
  ).then(res => {
    if (res.status === 304) {
      // There is no body to decode in a `304` response
      return new Promise(() => null);
    } else if (res.ok) {
      return res.json();
    } else {
      throw Error(res.statusText);
    }
  }).then(res => {
    if (res) {
      bopData = res;
      lastBopRequestTime = new Date().toUTCString();
      projector.scheduleRender();
    }
  }).catch(err =>
    console.warn(err)
  );
};

const sortData = function (resultsData) {
  // sort each race
  for (var bucket in resultsData) {
    for (var race in resultsData[bucket]) {
      resultsData[bucket][race].sort(function (a, b) {
        if (a.npr_winner) return -1;
        if (b.npr_winner) return 1;
        return b.votecount - a.votecount;
      });
    }
  }

  return resultsData;
};

const isBucketedByTime = bucket =>
  bucket.includes(':') &&
  (bucket.includes('a.m.') || bucket.includes('p.m.'));

const renderMaquette = function () {
  if (!bopData || !resultsData) {
    return h('div.results-wrapper', 'Loading...');
  }

  let numberOfRaces = 0;

  let buckets = [];
  for (let bucket in resultsData) {
    buckets.push(bucket);
    const group = resultsData[bucket];
    numberOfRaces += Object.keys(group).length;
  }

  const sortedBuckets = isBucketedByTime(buckets[0])
    ? buckets.sort(function (a, b) {
      var aHour = parseInt(a.split(':')[0]);
      var bHour = parseInt(b.split(':')[0]);

      if (a.slice(-4) === 'a.m.') return 1;
      if (b.slice(-4) === 'a.m.') return -1;
      if (aHour === bHour && a.indexOf('30') !== -1) return 1;
      if (aHour === bHour && b.indexOf('30') !== -1) return -1;
      else return aHour - bHour;
    })
    : buckets.sort();

  let sortedRacesPerBucket = {};

  for (let bucket in resultsData) {
    let sortedRaces = Object.keys(resultsData[bucket]).sort(function (a, b) {
      const aResult = resultsData[bucket][a][0];
      const bResult = resultsData[bucket][b][0];
      const as = determineSortKey(aResult);
      const bs = determineSortKey(bResult);

      const aState = as.substring(0, 2);
      const bState = bs.substring(0, 2);

      // if we pulled a number off something
      if (aState === bState && as.length > 2 && bs.length > 2) {
        const aID = as.split('-')[1];
        const bID = bs.split('-')[1];
        if (parseInt(aID) && parseInt(bID)) {
          if (parseInt(aID) < parseInt(bID)) {
            return -1;
          }
          if (parseInt(aID) > parseInt(bID)) {
            return 1;
          }
        }
      }

      if (as < bs) return -1;
      if (as > bs) return 1;
      return 0;
    });

    sortedRacesPerBucket[bucket] = sortedRaces;
  }

  const breakingIndex = Math.ceil((numberOfRaces + buckets.length) / 2) - Math.floor(buckets.length / 2);
  let raceIndex = 0;
  let firstColumn = {};
  let secondColumn = {};
  let selectedColumn = firstColumn;

  sortedBuckets.forEach(function (bucket) {
    const group = resultsData[bucket];
    sortedRacesPerBucket[bucket].map(function (id) {
      raceIndex += 1;

      if (!selectedColumn[bucket]) {
        selectedColumn[bucket] = [];
      }
      selectedColumn[bucket].push(group[id]);

      if (raceIndex === breakingIndex) {
        selectedColumn = secondColumn;
      }
    });
  });

  let duplicates = diffArrays(Object.keys(firstColumn), Object.keys(secondColumn));

  setTimeout(window.pymChild.sendHeight, 0);

  return h('div.results-wrapper', [
    h('div.results-header', [
      h('h1', boardTitle),
      bopData ? renderLeaderboard() : ''
    ]),
    h('div.results', {
      classes: {
        'dupe-second-column-header': duplicates.length > 0
      }
    }, [
      renderResultsColumn(firstColumn, 'first'),
      renderResultsColumn(secondColumn, 'last')
    ]),
    h('div.footer', [
      h('p', ['Source: AP ', h('span', [
        '(as of ',
        lastUpdated,
        ' ET)',
        // add note about independents to Senate footnote
        boardTitle.indexOf('Senate') !== -1 ? '. ' + copyBop['senate_footnote'] : ''
      ])
      ])
    ])
  ]);
};

const renderLeaderboard = function() {
    if (boardTitle.indexOf('House') !== -1) {
        var bop = bopData['house_bop'];
        return renderCongressBOP(bop);
    } else if (boardTitle.indexOf('Senate') !== -1) {
        var bop = bopData['senate_bop'];
        return renderCongressBOP(bop);
    } 
    // else if (boardTitle.indexOf('President') !== -1) {
    //   console.log(bopData)
    //     var bop = bopData['electoral_college'];
    //     return renderElectoralBOP(bop);
    // }
    else {
        return h('div.leaderboard', '');
    }
}

const renderCongressBOP = function (bop, chamber) {
  const demSeats = bop['Dem']['seats'];
  const gopSeats = bop['GOP']['seats'];
  const indSeats = bop['Other']['seats'];

  var netGain = 0;
  var netGainParty = 'no-change';
  var netGainPartyLabel = 'No change';
  var netGainTitle = '';
  var netGainExplanation = copyBop['pickups_' + chamber];

  if (bop['Dem']['pickups'] > 0) {
      netGain = bop['Dem']['pickups'];
      netGainParty = 'dem';
      netGainPartyLabel = 'Dem.';
      netGainTitle = copyBop['pickups_' + netGainParty];
      netGainTitle = netGainTitle.replace('___PICKUPS___', netGain);
  } else if (bop['GOP']['pickups'] > 0) {
      netGain = bop['GOP']['pickups'];
      netGainParty = 'gop';
      netGainPartyLabel = 'GOP';
      netGainTitle = copyBop['pickups_' + netGainParty];
      netGainTitle = netGainTitle.replace('___PICKUPS___', netGain);
  }

  const chamberWinner = bop['npr_winner'];
  const uncalledRaces = bop['uncalled_races'];

  return h('div.leaderboard', [
      h('div.results-header-group.net-gain', [
        h('h2.party', {
                classes: {
                  'party': true,
                  'dem': netGainParty === 'dem' ? true : false,
                  'gop': netGainParty === 'gop' ? true : false
                },
                title: netGainTitle
            }, [
            h('label', [
                copyBop['pickups_gain']
            ]),
            h('abbr', { title: netGainTitle }, [
                netGain > 0 ? (netGainPartyLabel + '+' + netGain) : netGain
            ])
        ])
      ]),
    h('div.results-header-group.dem', [
      h('h2.party', [
          h('label', [
              chamberWinner === 'Dem' ? h('i.icon.icon-ok') : '',
              'Dem.'
          ]),
          h('abbr', [
              demSeats
          ])
      ])
    ]),
    h('div.results-header-group.gop', [
        h('h2.party', [
            h('label', [
                chamberWinner === 'GOP' ? h('i.icon.icon-ok') : '',
                'GOP',
            ]),
            h('abbr', [
                gopSeats
            ])
        ])
    ]),
    h('div.results-header-group.other', [
        h('h2.party', [
            h('label', [
                'Ind.'
            ]),
            h('abbr', [
                indSeats
            ])
        ])
    ]),
    h('div.results-header-group.not-called', [
      h('h2.party', [
          h('label', [
              'Not Yet Called'
          ]),
          h('abbr', [
              uncalledRaces
          ])
      ])
    ])
  ]);
};

const renderResultsColumn = function (column, orderClass) {
  const className = 'column ' + orderClass;
  if (resultsData) {
    return h('div', {
      key: orderClass,
      class: className
    }, [
      Object.keys(column).map(key => renderResultsTable(key, column))
    ]);
  } else {
    return h('div', {
      key: 'init'
    });
  }
};

const renderResultsTable = function (key, column) {
  if (column.hasOwnProperty(key)) {
    var races = column[key];
  }

  if (races) {
    return [
      h('h2.bucketed-group', h(
        'span',
        isBucketedByTime(key)
          ? key + ' ET'
          : key
      )),
      h('table.races', [
        // needed for terrible table layout hack.
        // basically, i need a clean row to base the overall table structure on.
        // https://css-tricks.com/fixing-tables-long-strings/
        h('tr.structure', [
          h('th', { scope: 'col', class: 'pickup' }, ''),
          h('th', { scope: 'col', class: 'state' }, ''),
          h('th', { scope: 'col', class: 'candidate' }, ''),
          h('th', { scope: 'col', class: 'candidate-total' }, ''),
          h('th', { scope: 'col', class: 'candidate-total-spacer' }, ''),
          h('th', { scope: 'col', class: 'candidate-total' }, ''),
          h('th', { scope: 'col', class: 'candidates' }, ''),
          h('th', { scope: 'col', class: 'results-status' }, '')
        ]),
        h('thead', { class: 'screen-reader-only' }, [
          h('tr', [
            h('th', { scope: 'col', class: 'pickup' }, 'Pick-up?'),
            h('th', { scope: 'col', class: 'state' }, 'Name'),
            h('th', { scope: 'col', class: 'candidate' }, 'Candidate one name'),
            h('th', { scope: 'col', class: 'candidate-total' }, 'Candidate one vote percent'),
            h('th', { scope: 'col', class: 'candidate-total-spacer' }, ''),
            h('th', { scope: 'col', class: 'candidate-total' }, 'Candidate two vote percent'),
            h('th', { scope: 'col', class: 'candidates' }, 'Candidate two name'),
            h('th', { scope: 'col', class: 'results-status' }, 'Percent of precincts reporting')
          ])
        ]),
        races.map(race => renderRace(race))
      ])
    ];
  } else {
    return '';
  }
};

const createClassesForBoardCells = result => {
  return {
    'winner': result.npr_winner,
    'dem': result.party === 'Dem',
    'gop': result.party === 'GOP',
    'yes': result.party === 'Yes',
    'no': result.party === 'No',
    'other': !coloredParties.includes(result.party) && result.party !== 'Uncontested',
    'uncontested': result.party === 'Uncontested',
    'incumbent': result.incumbent,
    'longname': result.last.length > 8
  };
};

const renderRace = function (race) {
  let uncontested = (race.length === 1);

  const results = determineResults(race);
  const result1 = results[0];
  const result2 = results[1];

  let winningResult;
  if (result1['npr_winner']) {
    winningResult = result1;
  } else if (result2['npr_winner']) {
    winningResult = result2;
  }

  if (winningResult) {
    var called = true;
  }

  if (winningResult && result1['meta']['current_party'] && winningResult['party'] !== result1['meta']['current_party']) {
    var change = true;
  }

  if ((result1['votecount'] > 0 || result2['votecount'] > 0) || called) {
    var reporting = true;
  }

  return h('tr', {
    key: result1['last'],
    classes: {
      called,
      'party-change': change,
      reporting,
      uncontested
    }
  }, [
    h('td.pickup', {
      classes: {
        'winner': winningResult,
        'dem': winningResult && winningResult['party'] === 'Dem',
        'gop': winningResult && winningResult['party'] === 'GOP',
        'ind': winningResult && winningResult['party'] === 'Ind'
      }
    }, [
      insertRunoffImage(race)
    ]),
    h('th.state', {
      scope: 'row',
      classes: {
        'winner': winningResult,
        'dem': winningResult && winningResult['party'] === 'Dem',
        'gop': winningResult && winningResult['party'] === 'GOP',
        'ind': winningResult && coloredParties.indexOf(winningResult['party']) < 0
      }
    }, [
      decideLabel(result1)
    ]),
    h('td.candidate', { classes: createClassesForBoardCells(result1) }, [
      h('span.fname', [
        result1['first'] ? result1['first'] + ' ' : ''
      ]),
      h('span.lname', [
        result1['last']
      ])
    ]),
    h('td.candidate-total', { classes: createClassesForBoardCells(result1) }, [
      uncontested ? '' : h('span.candidate-total-wrapper', {
        updateAnimation: onUpdateAnimation
      }, [ Math.round(result1['votepct'] * 100) ])
    ]),
    h('td.candidate-total-spacer'),
    h('td.candidate-total', { classes: createClassesForBoardCells(result2) }, [
      uncontested ? '' : h('span.candidate-total-wrapper', {
        updateAnimation: onUpdateAnimation
      }, [ Math.round(result2['votepct'] * 100) ])
    ]),
    h('td.candidate', { classes: createClassesForBoardCells(result2) }, [
      h('span.fname', [
        result2 ? result2['first'] : ''
      ]),
      ' ',
      h('span.lname', [
        result2 ? result2['last'] : ''
      ])
    ]),
    uncontested ? h('td') : h('td.results-status', [
      calculatePrecinctsReporting(result1['precinctsreportingpct'])
    ])
  ]);
};

const areCandidatesSame = (c1, c2) =>
  c1.first === c2.first &&
  c1.last === c2.last &&
  c1.party === c2.party;

const determineResults = function (race) {
  // Create a fake 'uncontested' candidate when necessary
  if (race.length === 1) {
    race = race.concat(Object.assign(
      {},
      // Borrow the race metadata from the real candidate
      race[0],
      {
        first: '',
        last: 'uncontested',
        party: 'Uncontested',
        incumbent: false,
        npr_winner: false
      }
    ));
  }

  let result1;
  let result2;
  let loopArr;
  if (race[0]['precinctsreportingpct'] <= 0) {
    loopArr = race;
  } else {
    loopArr = [race[0], race[1]];
  }

  for (var i = 0; i < loopArr.length; i++) {
    var result = loopArr[i];
    if ((result['party'] === 'Dem' || result['party'] === 'Yes') && !result1) {
      result1 = result;
    } else if ((result['party'] === 'GOP' || result['party'] === 'No') && !result2) {
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
  // Otherwise, put the leader on the left side
  if (result1.party === result2.party) {
    sortedResults = sortedResults.sort(function (a, b) {
      return b['votepct'] - a['votepct'];
    });
  }
  if (
    sortedResults[0].party === 'GOP' &&
    sortedResults[1].party === 'GOP'
  ) {
    sortedResults = sortedResults.reverse();
  }

  return sortedResults;
};

const calculatePrecinctsReporting = function (pct) {
  if (pct > 0 && pct < 0.005) {
    return '<1';
  } else if (pct > 0.995 && pct < 1) {
    return '>99';
  } else {
    return Math.round(pct * 100);
  }
};

const decideLabel = function (race) {
  if (race['officename'] === 'U.S. House') {
    return race['statepostal'] + '-' + race['seatnum'];
  } else if (race['officename'] === 'President' && race['level'] === 'district' && race['reportingunitname'] !== 'At Large') {
        return race['statepostal'] + '-' + race['reportingunitname'].slice('-1');
      } else if (race['is_ballot_measure']) {
    // The AP provides ballot measure names in inconsistent formats
    const splitName = race.seatname.split(' - ');
    const isHyphenatedMeasureName = Boolean(race.seatname.match(/^[A-Z\d]+-[A-Z\d]+ /));

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
    return race['statepostal'];
  }
};

const insertRunoffImage = function (race) {
  let runoff = false;
  race.forEach(function (result) {
    if (result['runoff'] === true) {
      runoff = true;
    }
  });

  if (runoff) {
    return h('img.img-responsive', {
      src: '../assets/runoff.svg'
    });
  } else {
    return '';
  }
};

const onUpdateAnimation = function (domNode, properties, previousProperties) {
  const parent = domNode.parentNode;

  // add class to the parent row
  const parentRow = domNode.parentNode.parentNode;
  parentRow.classList.add('updated');

  let party = '';
  if (parent.classList.contains('dem')) {
    party = 'dem';
  } else if (parent.classList.contains('gop')) {
    party = 'gop';
  } else if (parent.classList.contains('yes')) {
    party = 'yes';
  } else if (parent.classList.contains('no')) {
    party = 'no';
  } else {
    party = 'other';
  }
  const sibling = domNode.parentNode.parentNode.querySelector('.candidate.' + party);

  // add class to the affected cells
  parent.classList.add('lighten');
  sibling.classList.add('lighten');

  setTimeout(function () {
    parentRow.classList.remove('updated');
    parent.classList.remove('lighten');
    sibling.classList.remove('lighten');
  }, 2000);
};

const determineSortKey = function (result) {
  if (result.officename === 'President') {
        if (result.level === 'district' && result.reportingunitname !== 'At Large') {
            return result.statepostal + '-' + result.reportingunitname.slice('-1');
        } else {
            return result.statepostal;
        }
    } else if (result.officename === 'U.S. Senate') {
    return result.statepostal;
  } else if (result.officename === 'Governor') {
    return result.statepostal;
  } else if (result.officename === 'U.S. House') {
    return result.statepostal + '-' + result.seatnum;
  } else if (result.is_ballot_measure) {
    return result.statepostal + '-' + result.seatname.split(' - ')[0];
  }
};

const diffArrays = function (arr1, arr2) {
  var ret = [];
  for (var i in arr1) {
    if (arr2.indexOf(arr1[i]) > -1) {
      ret.push(arr1[i]);
    }
  }
  return ret;
};

const renderElectoralBOP = function(bop) {
    const clintonVotes = bop['Clinton'];
    const trumpVotes = bop['Trump'];
    const mcMullinVotes = bop['McMullin'];
    const johnsonVotes = bop['Johnson'];
    const steinVotes = bop['Stein'];

    let hidePortraits = false;
    if (mcMullinVotes || johnsonVotes || steinVotes) {
        hidePortraits = true;
    }

    return h('div.leaderboard', {
            classes: {
                'top-two': !hidePortraits,
                'multiple': hidePortraits
            }
        },[
        h('div.results-header-group.dem', [
            h('img.candidate', {
                src: '../assets/clinton-thumb.png',
                classes: {
                    'hidden': hidePortraits
                }
            }),
            h('h2.party', [
                'Clinton',
                h('i.icon', {
                    classes: {
                        'icon-ok': clintonVotes >= 270
                    }
                })
            ]),
            h('p.total', [
                h('span.percentage', clintonVotes)
            ]),
        ]),
        h('div.results-header-group.gop', [
            h('img.candidate', {
                src: '../assets/trump-thumb.png',
                classes: {
                    'hidden': hidePortraits
                }
            }),
            h('h2.party', [
                'Trump',
                h('i.icon', {
                    classes: {
                        'icon-ok': trumpVotes >= 270
                    }
                })
            ]),
            h('p.total', [
                h('span.percentage', trumpVotes)
            ]),
        ]),
        h('div.results-header-group.other', {
            classes: {
                'hidden': johnsonVotes === 0
            }
        }, [
            h('h2.party', [
                'Johnson',
                h('i.icon', {
                    classes: {
                        'icon-ok': johnsonVotes >= 270
                    }
                })
            ]),
            h('p.total', [
                h('span.percentage', johnsonVotes)
            ]),
        ]),
        h('div.results-header-group.other', {
            classes: {
                'hidden': mcMullinVotes === 0
            }
        }, [
            h('h2.party', [
                'McMullin',
                h('i.icon', {
                    classes: {
                        'icon-ok': mcMullinVotes >= 270
                    }
                })
            ]),
            h('p.total', [
                h('span.percentage', mcMullinVotes)
            ]),
        ]),
        h('div.results-header-group.other', {
            classes: {
                'hidden': steinVotes === 0
            }
        }, [
            h('h2.party', [
                'Stein',
                h('i.icon', {
                    classes: {
                        'icon-ok': steinVotes >= 270
                    }
                })
            ]),
            h('p.total', [
                h('span.percentage', steinVotes)
            ]),
        ])
    ]);
}

export {
  initBigBoard,
  renderRace
};
