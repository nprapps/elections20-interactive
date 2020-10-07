import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { CountyMap } from "../countyMap";
import ResultsTableCounty from "../resultsTableCounty";

export class CountyResults extends Component {
  constructor(props) {
    super();

    this.state = { activeView: props.view };
    this.onCountyData = this.onCountyData.bind(this);
    this.onStateData = this.onStateData.bind(this);
  }

  onCountyData(json) {
    var office = json[0].office;
    this.setState({ data: json, office });
  }

  onStateData(json) {
    this.setState({ stateData: json });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `/data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onCountyData
    );
    gopher.watch(`/data/states/${this.props.state}.json`, this.onStateData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `/data/counties/${this.props.state}-${this.props.raceid}.json`,
      this.onData
    );
    gopher.unwatch(`/data/states/${this.props.state}.json`, this.onStateData);
  }

  render() {
    if (!this.state.data || !this.state.stateData) {
      return "";
    }
    // const stateResults = this.state.data.filter(
    //   c => !(c.first === "" && c.last === "Other")
    // );
    // Render a county-level table below

    return (
      <div class="results-elements">
        <h1>County results</h1>
        <CountyMap
          state={this.props.state.toUpperCase()}
          data={this.state.data}
        />
        <ResultsTableCounty
          state={this.props.state.toUpperCase()}
          data={this.state.data}
        />
      </div>
    );
  }
}
