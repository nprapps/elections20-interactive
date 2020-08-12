import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from '../gopher.js';
import { determineResults, decideLabel, getMetaData } from './util.js';
import { RacewideTable } from './racewideTable.js';

export class HouseResults extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    const sortedHouseKeys = Object.keys(json.results.house.results).sort(
      function (a, b) {
        return (
          json.results.house.results[a][0]['seatnum'] -
          json.results.house.results[b][0]['seatnum']
        );
      }
    );
    this.setState({
      houseKeys: sortedHouseKeys,
      house : json.results.house.results
    });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.state}.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.state}.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.house) {
      return '';
    }
    return (
      <div class="results-house">
        <div class="results-wrapper">
          {this.state.houseKeys.map(race => (
            <RacewideTable
              data={this.state.house[race]}
              className={'house-race'}
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
