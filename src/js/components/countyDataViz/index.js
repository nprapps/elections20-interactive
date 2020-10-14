import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";

import { CountyChart } from "./countyChart.js";
// import "./countyDataViz.less";

export class CountyDataViz extends Component {
  constructor(props) {
    super();

    this.ommittedCounties = 0;
    this.charts = [
      { key: "unemployment", header: "unemployment" },
      { key: "percent_white", header: "% White" },
      { key: "percent_black", header: "% Black" },
      { key: "population", header: "population" },
      { key: "median_income", header: "median income" },
      { key: "percent_bachelors", header: "% Graduate Degree" },
    ];
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {}

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.props.data) {
      return "";
    }

    var cleanedData = this.cleanedData = this.getCleanedData(
      this.props.data,
      this.props.order
    );

    console.log(cleanedData)
    if (!(cleanedData.length >= 10)) {
      return;
    }

    var footnote = this.ommittedCounties ? `${this.ommittedCounties} counties ommitted` : '';
    return (
      <div class="trends">
        <h2>County Trends</h2>
        <ul></ul>
        {this.charts.map(c => (

          <CountyChart
            data={cleanedData}
            variable={c.key}
            order={this.props.order}
            title={c.header}
          />
        ))}
        <div class="footnote">{footnote}</div>
      </div>
    );
  }

  getCleanedData(data, order) {
    var lead = order[0];
    var second = order[1];

    // TODO: is this the right cutoff?
    var resultsIn = data.filter(d => d.reportingPercent >= 1);

    var filtered = resultsIn.filter(function(d) {
      var countyParties = d.candidates.map(c => c.party);
      return countyParties.includes(lead) && countyParties.includes(second);
    });

    this.ommittedCounties = resultsIn.length - filtered.length;
    
    var cleaned = filtered.map(f => ({
      name: f.county.countyName,
      x: this.getX(f, lead, second),
      party: f.candidates[0].party,
      fips: f.fips,
      ...f.county
    }));
    return cleaned;
  }

  getX(county, lead, second) {
    // TODO: Verify this is correct
    // What do do if one of leading parties statewide isn't leading in county?
    var secondParty =
      county.candidates.filter(c => c.party == second)[0];
    var leadPer =
      county.candidates.filter(c => c.party == lead)[0].percent * 100;
    var secondPer = secondParty.percent * 100;

    return (leadPer / (leadPer + secondPer)) * 100;
  }
}
