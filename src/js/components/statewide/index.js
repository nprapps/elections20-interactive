import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import {
  determineResults,
  decideLabel,
  getMetaData,
  calculatePrecinctsReporting,
} from "../util.js";
import { RacewideTable } from "../racewideTable";
import { CountyResults } from '../countyResults';

const STATES_WITHOUT_COUNTY_INFO = ["AK"];

export class StatewideResults extends Component {
  constructor(props) {
    super();

    this.state = { activeView: props.view };
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState({ data: json });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `/data/counties/${this.props.state}-${this.props.ids[0]}.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `/data/counties/${this.props.state}-${this.props.ids[0]}.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.data) {
      return <div> Loading... </div>;
    }

    return (
      <div class="results-elements">
        <h2>Statewide Results </h2>
        {this.props.data.map(race => this.getResultsTable(race))}
      </div>
    );
  }

  getResultsTable(race) {
    // TODO: add better styles to this/rearrange.
    // Don't add link to county results at all for Alaska
    var county = "";
    if (!STATES_WITHOUT_COUNTY_INFO.includes(this.props.state)) {
      county = (
        <div id="county-results">
          <CountyResults state={this.props.state} raceid={race.id} />
        </div>
      );
    }
    return (
      <Fragment>
        <RacewideTable
          data={race}
          className={
            this.state.activeView === "senate"
              ? "results-senate"
              : "results-gubernatorial"
          }
        />
        {county}
      </Fragment>
    );
  }
}
