import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { determineResults, decideLabel, getMetaData } from "../util.js";
import { RacewideTable } from "../racewideTable";

export default class HouseResults extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    const sortedHouseResults = json.filter(r => r.office == "H").sort(
      function (a, b) {
        return parseInt(a.seatNumber) - parseInt(b.seatNumber);
      }
    );
    this.setState({
      houseKeys: sortedHouseResults.map(a => a.seatNumber),
      house: sortedHouseResults,
    });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`/data/states/${this.props.state}.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`/data/states/${this.props.state}.json`, this.onData);
  }

  render() {
    if (!this.state.house) {
      return "";
    }
    return (
      <div class="results-house">
        <div class="results-wrapper">
          { this.state.houseKeys.map(race => (
            <RacewideTable
              data={this.state.house.filter(a => a.seatNumber == race)[0]}
              className={"house-race"}
            />
          ))}
        </div>
      </div>
    );

    // TODO: Figure out if these are needed, don't see in original
    // classes: {
    //     'one-result': Object.keys(data['house']['results']).length === 1,
    //     'two-results': Object.keys(data['house']['results']).length === 2,
    //     'three-results': Object.keys(data['house']['results']).length === 3,
    //     'four-results': Object.keys(data['house']['results']).length === 4
    //   }
  }
}
