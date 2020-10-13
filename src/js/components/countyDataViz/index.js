import { h, Component, createRef } from "preact";
import gopher from "../gopher.js";

import { CountyChart } from "./countyChart.js";
// import "./countyDataViz.less";

export class CountyDataViz extends Component {
  constructor(props) {
    super();

    this.charts = [{key: "unemployment", header: "Unemployment"}, {key: "percent_white", header: "% White"}];
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {}

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.props.data || !this.enoughCountiesIn(this.props.data)) {
      return '';
    }
    return (
      <div class="trends">
        <h2>County Trends</h2>
        <ul></ul>
        {this.charts.map(c => (
          <CountyChart data={this.props.data} variable={c.key} order={this.props.order} title={c.header}/>
        ))}
      </div>
    );
  }

  enoughCountiesIn(data) {
    return data.filter(d => d.reportingPercent >= .5).length >= 10;
  }
}
