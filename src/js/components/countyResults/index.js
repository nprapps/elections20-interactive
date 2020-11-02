import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import CountyMap from "../countyMap";
import ResultsTableCounty from "../resultsTableCounty";
import { CountyDataViz } from "../countyDataViz";

export default class CountyResults extends Component {
  constructor(props) {
    super();

    this.state = { activeView: props.view };
    this.onCountyData = this.onCountyData.bind(this);
  }

  onCountyData(json) {
    var updated = Math.max(...json.results.map(r => r.updated));
    var event = new CustomEvent("updatedtime", {
      detail: updated,
      bubbles: true,
    });
    this.base.dispatchEvent(event);
    var office = json.results[0].office;
    this.setState({ data: json.results, office });
  }

  async componentDidMount() {
    gopher.watch(
      `./data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onCountyData
    );
  }

  componentWillUnmount() {
    gopher.unwatch(
      `./data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onCountyData
    );
  }

  render() {
    if (!this.state.data) {
      return "";
    }

    // Don't show data viz for special elections as they may have two candidates
    // of the same party running against each other.
    var dataViz;
    if (!this.props.isSpecial) {
      dataViz = (
        <CountyDataViz
          data={this.state.data}
          order={this.props.order.slice(0, 2)}
          state={this.props.state.toUpperCase()}
        />
      );
    }

    return (
      <div class="results-elements">
        <h3>Results By County</h3>
        <CountyMap
          state={this.props.state.toUpperCase()}
          data={this.state.data}
          sortOrder={this.props.order}
          isSpecial={this.props.isSpecial}
        />
        {dataViz}
        <ResultsTableCounty
          state={this.props.state.toUpperCase()}
          data={this.state.data}
          sortOrder={this.props.order}
        />
      </div>
    );
  }
}
