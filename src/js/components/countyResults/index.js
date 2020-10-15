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

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `./data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onCountyData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `./data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.data) {
      return "";
    }

    var dataViz;
    if (!this.props.isSpecial) {
      dataViz = (
        <CountyDataViz data={this.state.data} order={this.props.order} />
      );
    }

    return (
      <div class="results-elements">
        <h2>Results By County</h2>
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
