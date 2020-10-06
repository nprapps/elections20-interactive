import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardNamed"
// import Strings from "strings.sheet.json";

export class BoardSenate extends Component {
  constructor(props) {
    super();

    this.state = { };
    this.onData = this.onData.bind(this);
  }

  onData(races) {
    console.log(races)
    // var grouped = {};
    // for (var r of races) {
    //   if (!grouped[r.office]) grouped[r.office] = [];
    //   grouped[r.office].push(r);
    // }

    //TODO: filter house races for "featured"

    this.setState({ races });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `./data/senate.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `./data/senate.json`,
      this.onData
    );
  }

  render() {
    var { races } = this.state;
    if (!races) {
      return "";
    }

    // var offices = "PGSHI".split("").filter(o => o in grouped);
    
    // return offices.map(o => {
    //   var data = grouped[o];
    //   var label = Strings[`office-${o}`];

    return races.map(r => <Results race={r}/>);
  }
}
