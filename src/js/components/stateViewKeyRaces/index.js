import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Strings from "strings.sheet.json";

export default class KeyRaces extends Component {
  constructor(props) {
    super();

    this.showHousesIfMoreThanN = 10;
    this.statesWithoutCountyInfo = ["AK"]; // Get me passed in
    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(data) {
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
      var label = Strings[`office-${o}`];
      return (
        <div class="key-race-group">
          <h2>{label}</h2>
          <div class="races">
            {data.map((r) => (
              // TODO: set up the results table here instead
              <div>{r.id}</div>
            ))}
          </div>
        </div>
      );
    });
  }
}
