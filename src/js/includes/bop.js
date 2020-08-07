// npm libraries
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import countdown from './countdown';
import {
    buildDataURL,
    classify,
    getHighestPymEmbed,
    shouldUsePJAXForHost
} from './helpers.js';

var copyBop = window.copy.bop;

// Global vars
var DATA_FILE = 'top-level-results.json';

var CONGRESS = {
    house: {},
    senate: {}
};
var DEFAULT_WIDTH = 600;
var LOAD_INTERVAL = 5000;

var lastUpdated = '';
var charts = Object.keys(CONGRESS);
var bopData = null;
var graphicWidth = null;
var timestamp = null;
var lastRequestTime = '';
var indicator = null;

var houseCalled = [];
var senateCalled = [];

/*
 * Initialize the graphic.
 */
const initBop = function (containerWidth) {
    timestamp = select('.footer .timestamp');
    indicator = document.querySelector('.countdown');

    if (!containerWidth) {
        containerWidth = DEFAULT_WIDTH;
    }
    graphicWidth = containerWidth;

    loadData();
    // console.log('YOU TURNED OFF THE REFRESH INTERVAL');
    setInterval(loadData, LOAD_INTERVAL);
};

/*
 * Load a datafile
 */
var loadData = function () {
  window.fetch(
    buildDataURL(DATA_FILE),
    { headers: { 'If-Modified-Since': lastRequestTime } }
  ).then(res => {
    if (res.status === 304) {
      // There is no body to decode in a `304` response
      // countdown(indicator, LOAD_INTERVAL);
      return new Promise(() => null);
    } else if (res.ok) {
      return res.json();
    } else {
      throw Error(res.statusText);
    }
  }).then(res => {
    lastRequestTime = new Date().toUTCString();
    if (res) {
      bopData = res;
      lastUpdated = res.last_updated;
      formatData();
      // countdown(indicator, LOAD_INTERVAL);
    }
  }).catch(err => console.warn(err));
};

/*
 * Format graphic data for processing by D3.
 */
var formatData = function () {
    // reset vars
    houseCalled = [];
    senateCalled = [];
    CONGRESS['house'] = [];
    CONGRESS['senate'] = [];

    // redefine based on newly-updated data
    var hData = bopData['house_bop'];
    houseCalled = [
        { 'name': 'Dem.', 'val': hData['Dem']['seats'], 'isWinner': (hData['npr_winner'] === 'Dem') },
        { 'name': 'Ind.', 'val': hData['Other']['seats'], 'isWinner': (hData['npr_winner'] === 'Ind') },
        { 'name': 'Not yet called', 'val': hData['uncalled_races'] },
        { 'name': 'GOP', 'val': hData['GOP']['seats'], 'isWinner': (hData['npr_winner'] === 'GOP') }
    ];

    CONGRESS['house']['total'] = hData['total_seats'];
    CONGRESS['house']['uncalled_races'] = hData['uncalled_races'];
    CONGRESS['house']['label'] = copyBop['label_house'];
    CONGRESS['house']['winner'] = hData['npr_winner'];

    if (hData['Dem']['pickups'] > 0) {
        CONGRESS['house']['pickup_seats'] = hData['Dem']['pickups'];
        CONGRESS['house']['pickup_party'] = 'Dem';
    } else if (hData['GOP']['pickups'] > 0) {
        CONGRESS['house']['pickup_seats'] = hData['GOP']['pickups'];
        CONGRESS['house']['pickup_party'] = 'GOP';
    } else {
        CONGRESS['house']['pickup_seats'] = '0';
        CONGRESS['house']['party'] = null;
    }

    var sData = bopData['senate_bop'];
    senateCalled = [
        { 'name': 'Dem.', 'val': sData['Dem']['seats'], 'isWinner': (sData['npr_winner'] === 'Dem') },
        { 'name': 'Ind.', 'val': sData['Other']['seats'], 'isWinner': (sData['npr_winner'] === 'Ind') },
        { 'name': 'Not yet called', 'val': sData['uncalled_races'] },
        { 'name': 'GOP', 'val': sData['GOP']['seats'], 'isWinner': (sData['npr_winner'] === 'GOP') }
    ];
    CONGRESS['senate']['total'] = sData['total_seats'];
    CONGRESS['senate']['uncalled_races'] = sData['uncalled_races'];
    CONGRESS['senate']['label'] = copyBop['label_senate'];
    CONGRESS['senate']['winner'] = sData['npr_winner'];

    if (sData['Dem']['pickups'] > 0) {
        CONGRESS['senate']['pickup_seats'] = sData['Dem']['pickups'];
        CONGRESS['senate']['pickup_party'] = 'Dem';
    } else if (sData['GOP']['pickups'] > 0) {
        CONGRESS['senate']['pickup_seats'] = sData['GOP']['pickups'];
        CONGRESS['senate']['pickup_party'] = 'GOP';
    } else {
        CONGRESS['senate']['pickup_seats'] = '0';
        CONGRESS['senate']['party'] = null;
    }

    [ houseCalled, senateCalled ].forEach(function (d, i) {
        var x0 = 0;

        d.forEach(function (v, k) {
            v['x0'] = x0;
            v['x1'] = x0 + v['val'];
            x0 = v['x1'];
        });
    });

    redrawChart();
};

/*
 * Render the graphic(s). Called by pym with the container width.
 */
const renderBop = function (containerWidth) {
    graphicWidth = containerWidth;
    if (bopData) {
        redrawChart();
    } else {
        // This function has a `redrawChart` callback
        loadData();
    }
};

var redrawChart = function () {
    // Clear existing graphic (for redraw)
    var containerElement = select('#bop');
    containerElement.html('');

    const pymToSendNavigationTo = getHighestPymEmbed(window);
    const domain = pymToSendNavigationTo &&
        new URL(pymToSendNavigationTo.parentUrl).hostname;

    if (copyBop['show_pickups'] === 'yes') {
        containerElement.append('h2')
            .html(copyBop['hed_pickups']);

        containerElement.append('div')
            .attr('class', 'pickups');

        renderPickups({
            container: '#bop .pickups'
        });
    }

    containerElement.append('h2')
        .html(copyBop['hed_bars']);

    charts.forEach(function (d, i) {
        var chartDiv = containerElement.append('div')
            .attr('class', 'chart ' + classify(d));

        chartDiv.on('click', function () {
            var thisLink = copyBop['board_url_' + classify(d)];
            if (shouldUsePJAXForHost(domain) && pymToSendNavigationTo) {
                pymToSendNavigationTo.sendMessage('pjax-navigate', thisLink);
            } else {
                window.open(thisLink, '_top');
            }
        });

        // Render the chart!
        renderStackedBarChart({
            container: '#bop .chart.' + classify(d),
            width: graphicWidth,
            dataCalled: d === 'house' ? houseCalled : senateCalled,
            chart: d
        });
    });

    // update timestamp
    timestamp.html('(as of ' + lastUpdated + ' ET)');

    // Update iframe
    if (window.pymChild) {
        window.pymChild.sendHeight();
    }
};

/*
 * Render pickups
 */
var renderPickups = function (config) {
    var containerElement = select(config['container']);

    const pymToSendNavigationTo = getHighestPymEmbed(window);
    const domain = pymToSendNavigationTo &&
        new URL(pymToSendNavigationTo.parentUrl).hostname;

    charts.forEach(function (d, i) {
        var chamberElement = containerElement.append('div')
            .attr('class', 'chamber ' + classify(d));

        chamberElement.on('click', function () {
            var thisLink = copyBop['board_url_' + classify(d)];
            if (shouldUsePJAXForHost(domain) && pymToSendNavigationTo) {
                pymToSendNavigationTo.sendMessage('pjax-navigate', thisLink);
            } else {
                window.open(thisLink, '_top');
            }
        });

        chamberElement.append('h3')
            .text(copyBop['label_' + d]);

        chamberElement.append('p')
            .attr('class', 'desc')
            .html(copyBop['pickups_' + d]);

        var gainElement = chamberElement.append('p')
            .attr('class', 'net-gain');
        gainElement.append('abbr')
            .attr('class', function () {
                if (CONGRESS[d]['pickup_party']) {
                    return classify(CONGRESS[d]['pickup_party']);
                }
            })
            .attr('title', function () {
                var party = CONGRESS[d]['pickup_party'];
                var t = copyBop['pickups_none'];
                if (party) {
                    party = party.toLowerCase();
                    t = copyBop['pickups_' + party];
                    t = t.replace('___PICKUPS___', CONGRESS[d]['pickup_seats']);
                }

                return t;
            })
            .text(function () {
                if (CONGRESS[d]['pickup_party']) {
                    var party = CONGRESS[d]['pickup_party'];
                    if (party === 'Dem') {
                        party = 'Dem.';
                    }
                    return party + ' +' + CONGRESS[d]['pickup_seats'];
                } else {
                    return CONGRESS[d]['pickup_seats'];
                }
            });
        gainElement.append('i')
            .text(copyBop['pickups_gain']);
    });
};

/*
 * Render a stacked bar chart.
 */
var renderStackedBarChart = function (config) {
    /*
     * Setup
     */
    var barHeight = 20;
    var valueGap = 6;

    var margins = {
        top: 5,
        right: 0,
        bottom: 5,
        left: 0
    };

    var chamber = config['chart'];
    var uncalled = CONGRESS[chamber]['uncalled_races'];
    var half = CONGRESS[chamber]['total'] / 2;
    // Want to display 50%+1 seats, even for Senate; see discussion:
    // https://github.com/nprapps/elections18-graphics/issues/118
    var majority = Math.floor(half + 1);

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = barHeight;

    // Clear existing graphic (for redraw)
    var containerElement = select(config['container']);
    containerElement.append('h3')
        .text(CONGRESS[chamber]['label'])
        .attr('style', 'margin-left: ' + margins['left'] + 'px; margin-right: ' + margins['right'] + 'px;');

    /*
     * Create D3 scale objects.
     */
    var min = 0;
    var max = CONGRESS[chamber]['total'];

    var xScale = scaleLinear()
        .domain([min, max])
        .rangeRound([0, chartWidth]);

    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    var chartElement = chartWrapper.append('svg')
        .attr('width', chartWidth + margins['left'] + margins['right'])
        .attr('height', chartHeight + margins['top'] + margins['bottom'])
        .append('g')
        .attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

    /*
     * Render bars to chart.
     */
    var group = chartElement.selectAll('.group')
        .data([ config['dataCalled'] ])
        .enter().append('g')
            .attr('class', function (d, i) {
                return 'group group-' + i;
            });

    group.selectAll('rect')
        .data(function (d) {
            return d;
        })
        .enter().append('rect')
            .attr('class', function (d) {
                return classify(d['name']);
            })
            .attr('x', function (d) {
                return xScale(d['x0']);
            })
            .attr('width', function (d) {
                return Math.abs(xScale(d['x1']) - xScale(d['x0']));
            })
            .attr('height', barHeight);

    /*
     * Render majority line.
     */
    var majorityMarker = chartElement.append('g')
        .attr('class', 'majority-marker');
    majorityMarker.append('line')
        .attr('x1', xScale(half))
        .attr('x2', xScale(half))
        .attr('y1', -margins['top'])
        .attr('y2', (barHeight + margins['top']));

    /*
     * Bar labels
     */
    var barLabels = chartWrapper.append('div')
        .attr('class', 'bar-labels');

    config['dataCalled'].forEach(function (d) {
        var lbl = d['name'];
        var xPos = null;
        var sPos = null; // css for xPos
        var showLabel = true;
        switch (d['name']) {
            case 'Dem.':
                xPos = xScale(d['x0']);
                sPos = 'left: 0px; ';
                lbl = (d['isWinner'] ? '<i class="icon icon-ok"></i>Dem.' : 'Dem.');
                break;
            case 'GOP':
                xPos = xScale(d['x1']);
                sPos = 'right: 0px; ';
                lbl = (d['isWinner'] ? '<i class="icon icon-ok"></i>GOP' : 'GOP');
                break;
            default:
                xPos = xScale(d['x0'] + ((d['x1'] - d['x0']) / 2)) - 30;
                sPos = 'left: ' + xPos + 'px; ';
                if (d['name'] === 'Not yet called' || d['val'] === 0) {
                    showLabel = false;
                }
                break;
        }

        if (showLabel) {
            barLabels.append('label')
                .html(lbl + ': ' + d['val'])
                .attr('class', 'party ' + classify(d['name']))
                .attr('style', function () {
                    var s = '';
                    s += 'top: ' + 0 + '; ';
                    s += sPos;
                    return s;
                });
        }
    });

    // shift xPos of independent label
    // base positioning on the xpos/width of the "Dem." label
    barLabels.select('.party.ind')
        .style('left', function () {
            var indX = parseInt(select(this).style('left'));

            var demOffset = valueGap;
            if (CONGRESS[chamber]['winner'] == 'Dem') {
                demOffset = 18; // account for icon width
            }

            var demX = parseInt(barLabels.select('.party.dem').style('left'));
            var demWidth = document.querySelector('label.dem').getBoundingClientRect()['width'];
            var demExtent = demX + demWidth + demOffset;

            if (indX < demExtent) {
                indX = demExtent;
            }

            return Math.ceil(indX) + 'px';
        });

    // majority and seats remaining
    chartWrapper.append('h4')
        .text(majority + ' needed for majority | ' + uncalled + ' not yet called');
};

export {
    initBop,
    renderBop
};
