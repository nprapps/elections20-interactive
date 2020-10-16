import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";

import { CountyChart } from "./countyChart.js";
import { availableMetrics } from "../util.js";
// import "./countyDataViz.less";

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
    var cleanedData = this.getCleanedData(this.props.data, this.props.order);

    var charts = [];
    for (var m of Object.keys(availableMetrics)) {
      if (m == 'countyName') {
        continue
      }
      var metric = availableMetrics[m];
      metric.corr = this.getCorrs(metric.key, cleanedData);
      charts.push(metric);
    }

    if (cleanedData.length >= 10) {
      this.setState({
        cleanedData,
        charts: charts.sort((a, b) => b.corr - a.corr),
      });
    }
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.state.cleanedData) {
      return "";
    }

    var footnote = this.ommittedCounties
      ? `${this.ommittedCounties} counties ommitted`
      : "";
    return (
      <div class="trends">
        <h2 ref={this.trendsRef}>County Trends</h2>
        <div class={this.state.collapsed ? "collapsed" : null}>
        {this.state.charts.map(c => (
          <div class="chart-wrapper">
            <CountyChart
              data={this.state.cleanedData}
              variable={c.key}
              order={this.props.order}
              title={c.name}
              corr={c.corr}
              formatter={c.format}
            />
          </div>
        ))}
        </div>
        <button
          class={`toggle-table ${this.state.cleanedData.length > 4 ? "" : "hidden"}`}
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

    // TODO: is this the right cutoff?
    var resultsIn = data.filter(d => d.reportingPercent >= 1);

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
    // TODO: Verify this is correct
    // What do do if one of leading parties statewide isn't leading in county?
    var secondParty = county.candidates.filter(c => c.party == second)[0];
    var leadPer =
      county.candidates.filter(c => c.party == lead)[0].percent * 100;
    var secondPer = secondParty.percent * 100;

    return (leadPer / (leadPer + secondPer)) * 100;
  }

  getCorrs(v, data) {
    var correlation = getPearsonCorrelation(
      data.map(d => d.x),
      data.map(d => parseFloat(d[v]))
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
