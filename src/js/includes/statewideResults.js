import { h, Component, Fragment } from 'preact';
import { buildDataURL, getHighestPymEmbed } from './helpers.js';
import gopher from '../gopher.js';
import { determineResults, decideLabel, getMetaData } from './util.js';
import { RacewideTable } from './racewideTable.js';

export class StatewideResults extends Component {
  constructor(props) {
    super();

    let dataFile;
    if (props.view === 'senate' || props.view === 'governor') {
      dataFile = `https://apps.npr.org/elections18-graphics/data/${props.state}-counties-${props.view}.json`;
    } else if (props.view === 'senate-special') {
      dataFile = `https://apps.npr.org/elections18-graphics/data/${props.state}-counties-senate-special.json`;
    }

    this.state = { dataFile, activeView: props.view };
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState(
      {data: json.results}
    );
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(this.state.dataFile, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(this.state.dataFile, this.onData);
  }

  render() {
    if (!this.state.data) {
      return '';
    }
    return (
      <div class="results-elements">
        <h2>Statewide Results</h2>
        {
          <RacewideTable
            data={this.state.data.state}
            className={
              this.state.activeView === 'senate'
                ? 'results-senate'
                : 'results-gubernatorial'
            }
          />
        }
      </div>
    );
  }
}
