import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import ResultsTableCandidates from "../resultsTableCandidates";
import Strings from "strings.sheet.json";

export default class KeyRaces extends Component {
  constructor(props) {
    super();

    this.showHousesIfMoreThanN = 10;
    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    var updated = Math.max(...data.results.map(r => r.updated));
    var event = new CustomEvent("updatedtime", { detail: updated, bubbles: true });
    this.base.dispatchEvent(event);

    var grouped = {};
    for (var r of data.results) {
      if (!grouped[r.office]) grouped[r.office] = [];
      grouped[r.office].push(r);
    }

    //TODO: filter house races for "featured"

    this.setState({ races: data.results, grouped });
  }

  componentDidMount() {
    gopher.watch(`./data/states/${this.props.state}.json`, this.onData);
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/states/${this.props.state}.json`, this.onData);
  }

  render() {
    var { races, grouped } = this.state;
    if (!races) {
      return "";
    }

    var offices = "PGSHI".split("").filter((o) => o in grouped);

    return offices.map((o) => {
      var data = grouped[o];
      console.log(data)
      // Filter house races for keyRaces
      if (o == 'H') {
        data = data.filter(d => d.keyRace);
        if (!data.length) return;
      }

      var label = Strings[`office-${o}`];
      return (
        <div class="key-race-group">
          <h2>{label}</h2>
          <div class="races">
            {data.map((r) => (
              <ResultsTableCandidates data={r} />
            ))}
          </div>
        </div>
      );
    });
  }
}
