import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardPresident";

export default class BoardPresident extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.onData = this.onData.bind(this);
  }

  onData(races) {
    this.setState({ races });
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(`./data/president.json`, this.onData);
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(`./data/president.json`, this.onData);
  }

  render() {
    var { races } = this.state;
    if (!races) {
      return "";
    }

    return <>
      <h1>President</h1>
      <div class="placeholder">Map or dataviz</div>
      <Results races={races}/>
    </>
  }
}
