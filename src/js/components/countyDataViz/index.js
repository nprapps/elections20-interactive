import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";

import { CountyChart } from "./countyChart.js";
import { getAvailableMetrics, getCountyVariable, sortByParty } from "../util.js";

export class CountyDataViz extends Component {
  constructor(props) {
    super();

    this.ommittedCounties = 0;

    this.trendsRef = createRef();

    this.toggleCollapsed = this.toggleCollapsed.bind(this);
    this.state = {
      collapsed: true,
    };
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    // Sort by party for consistent display.
    var sorted = this.props.order.slice().sort(sortByParty);
    var cleanedData = this.getCleanedData(this.props.data, sorted);

    // Create display charts and sort by their correlations
    var metrics = getAvailableMetrics(this.props.state);
    var charts = [];
    for (var m of Object.keys(metrics)) {
      var metric = metrics[m];
      if (metric.hideFromToggle) continue;
      metric.corr = this.getCorrs(metric.key, cleanedData);
      charts.push(metric);
    }

    if (cleanedData.length >= 10) {
      this.setState({
        cleanedData,
        sorted,
        charts: charts.sort((a, b) => b.corr - a.corr),
      });
    }
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {}

  render() {
    if (!this.state.cleanedData) {
      return "";
    }

    var footnote = this.ommittedCounties
      ? "Counties where leading parties differ from statewide leading parties are omitted."
      : "";
    return (
      <div class="trends">
        <h3>Demographic Trends</h3>
        <div class={this.state.collapsed ? "collapsed" : null} ref={this.trendsRef}>
          {this.state.charts.map(c => (
            <div class="chart-wrapper">
              <CountyChart
                data={this.state.cleanedData}
                variable={c.key}
                order={this.state.sorted}
                title={c.name}
                corr={c.corr}
                formatter={c.format}
              />
            </div>
          ))}
        </div>
        <div class="footnote">Trends subject to change as results come in. {footnote}</div>
        <button
          class={`toggle-table ${
            this.state.cleanedData.length > 4 ? "" : "hidden"
          }`}
          onclick={this.toggleCollapsed}
          data-more="Show all"
          data-less="Show less">
          {this.state.collapsed ? `Show all ▼` : `Show less ▲`}
        </button>
        
      </div>
    );
  }

  getCleanedData(data, order) {
    var lead = order[0].party;
    var second = order[1].party;

    var resultsIn = data.filter(d => d.reportingPercent > 0.5);

    // Filter out counties whose top 2 candidates don't match state.
    var filtered = resultsIn.filter(function (d) {
      var countyParties = d.candidates.slice(0, 2).map(c => c.party);
      return countyParties.includes(lead) && countyParties.includes(second);
    });

    this.ommittedCounties = resultsIn.length - filtered.length;

    var cleaned = filtered.map(f => ({
      name: f.county.countyName,
      x: this.getX(f, lead, second),
      party: f.candidates[0].party,
      fips: f.fips,
      ...f.county,
    }));

    return cleaned;
  }

  getX(county, lead, second) {
    var [secondParty] = county.candidates.filter(c => c.party == second);
    var [firstParty] = county.candidates.filter(c => c.party == lead);
    var leadPer = firstParty.percent * 100;
    var secondPer = secondParty.percent * 100;

    return secondPer / (leadPer + secondPer);
  }

  getCorrs(v, data) {
    var correlation = pearsonCorrelation([data.map(d => d.x),
      data.map(d => getCountyVariable(d, v))], 0, 1);
    return Math.abs(correlation);
  }

  scrollToRef(ref) {
    if (ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView(true);
    }
  }

  toggleCollapsed() {
    const currentState = this.state.collapsed;
    this.setState({ collapsed: !currentState }, () => {
      this.scrollToRef(this.trendsRef);
    });
  }
}

// Source: https://gist.github.com/matt-west/6500993//
/**
 *  Calculate the person correlation score between two items in a dataset.
 *
 *  @param  {object}  prefs The dataset containing data about both items that
 *                    are being compared.
 *  @param  {string}  p1 Item one for comparison.
 *  @param  {string}  p2 Item two for comparison.
 *  @return {float}  The pearson correlation score.
 */
function pearsonCorrelation(prefs, p1, p2) {
  var si = [];

  for (var key in prefs[p1]) {
    if (prefs[p2][key]) si.push(key);
  }

  var n = si.length;

  if (n == 0) return 0;

  var sum1 = 0;
  for (var i = 0; i < si.length; i++) sum1 += prefs[p1][si[i]];

  var sum2 = 0;
  for (var i = 0; i < si.length; i++) sum2 += prefs[p2][si[i]];

  var sum1Sq = 0;
  for (var i = 0; i < si.length; i++) {
    sum1Sq += Math.pow(prefs[p1][si[i]], 2);
  }

  var sum2Sq = 0;
  for (var i = 0; i < si.length; i++) {
    sum2Sq += Math.pow(prefs[p2][si[i]], 2);
  }

  var pSum = 0;
  for (var i = 0; i < si.length; i++) {
    pSum += prefs[p1][si[i]] * prefs[p2][si[i]];
  }

  var num = pSum - (sum1 * sum2 / n);
  var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) *
      (sum2Sq - Math.pow(sum2, 2) / n));

  if (den == 0) return 0;

  return num / den;
}