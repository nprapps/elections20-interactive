import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";

import { CountyChart } from "./countyChart.js";
import { availableMetrics, getCountyVariable, sortByParty } from "../util.js";

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
    var charts = [];
    for (var m of Object.keys(availableMetrics)) {
      var metric = availableMetrics[m];
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
      ? `${this.ommittedCounties} counties ommitted due top two parties being different than overall state top two parties`
      : "";
    return (
      <div class="trends">
        <h3 ref={this.trendsRef}>County Trends</h3>
        <div class={this.state.collapsed ? "collapsed" : null}>
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
        <button
          class={`toggle-table ${
            this.state.cleanedData.length > 4 ? "" : "hidden"
          }`}
          onclick={this.toggleCollapsed}
          data-more="Show all"
          data-less="Show less">
          {this.state.collapsed ? `Show all ▼` : `Show less ▲`}
        </button>
        <div class="footnote">{footnote}</div>
      </div>
    );
  }

  getCleanedData(data, order) {
    var lead = order[0].party;
    var second = order[1].party;

    var resultsIn = data.filter(d => d.reportingPercent >= 0.5);

    // Filter out counties whose top 2 candidates don't match state.
    var filtered = resultsIn.filter(function (d) {
      var countyParties = d.candidates.map(c => c.party);
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
    var correlation = getPearsonCorrelation(
      data.map(d => d.x),
      data.map(d => getCountyVariable(d, v))
    );
    return Math.abs(correlation);
  }

  scrollToRef(ref) {
    ref.current.scrollIntoView(true, { block: "nearest" });
  }

  toggleCollapsed() {
    const currentState = this.state.collapsed;
    this.setState({ collapsed: !currentState }, () => {
      this.scrollToRef(this.trendsRef);
    });
  }
}

/* TODO: figure out if we can use this or if it needs to be cited more strongly?
 *  Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
 */
function getPearsonCorrelation(x, y) {
  var shortestArrayLength = 0;
  if (x.length == y.length) {
    shortestArrayLength = x.length;
  } else if (x.length > y.length) {
    shortestArrayLength = y.length;
    console.error(
      "x has more items in it, the last " +
        (x.length - shortestArrayLength) +
        " item(s) will be ignored"
    );
  } else {
    shortestArrayLength = x.length;
    console.error(
      "y has more items in it, the last " +
        (y.length - shortestArrayLength) +
        " item(s) will be ignored"
    );
  }
  var xy = [];
  var x2 = [];
  var y2 = [];
  for (var i = 0; i < shortestArrayLength; i++) {
    xy.push(x[i] * y[i]);
    x2.push(x[i] * x[i]);
    y2.push(y[i] * y[i]);
  }
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_x2 = 0;
  var sum_y2 = 0;
  for (var i = 0; i < shortestArrayLength; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += xy[i];
    sum_x2 += x2[i];
    sum_y2 += y2[i];
  }
  var step1 = shortestArrayLength * sum_xy - sum_x * sum_y;
  var step2 = shortestArrayLength * sum_x2 - sum_x * sum_x;
  var step3 = shortestArrayLength * sum_y2 - sum_y * sum_y;
  var step4 = Math.sqrt(step2 * step3);
  var answer = step1 / step4;
  return answer;
}
