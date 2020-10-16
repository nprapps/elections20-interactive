import { h, Component, Fragment, createRef } from "preact";
import gopher from "../gopher.js";
import Results from "../resultsBoardPresident";
import TestBanner from "../testBanner";
import DateFormatter from "../dateFormatter";
import states from "states.sheet.json";

export default class BoardPresident extends Component {
  constructor(props) {
    super();

    this.state = {};
    this.svgRef = createRef();
    this.onData = this.onData.bind(this);
  }

  onData(data) {
    var latest = Math.max(...data.results.map(r => r.updated));
    this.setState({ races: data.results, test: data.test, latest });
  }

  async componentDidMount() {
    gopher.watch(`./data/president.json`, this.onData);

    var response = await fetch("./assets/cartogram.svg");
    var text = await response.text();
    var svg = await this.loadSVG(text);
    this.setState({ svg: svg });
  }

  componentWillUnmount() {
    gopher.unwatch(`./data/president.json`, this.onData);
  }

  render() {
    var { races, test, latest } = this.state;
    if (!races) {
      return "";
    }

    races.forEach(function(r) {
      r.name = states[r.state].name;
      r.districtDisplay = (r.district !== "AL") ? r.district : "";
    });

    var sorted = races.sort(function(a,b) {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      if (a.districtDisplay > b.districtDisplay) return 1;
      if (a.districtDisplay < b.districtDisplay) return -1;
      return 0;
    });

    var buckets = {
      likelyD: [],
      tossup: [],
      likelyR: []
    };

    sorted.forEach(function(r) {
      var stateName = r.state + (r.districtDisplay ? "-" + r.districtDisplay : "");
      var rating = states[stateName].rating;

      if (rating == "solid-d" || rating == "likely-d") {
        buckets.likelyD.push(r);
      } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
        buckets.tossup.push(r);
      } else if (rating == "solid-r" || rating == "likely-r") {
        buckets.likelyR.push(r);
      }
    });

    return <>
      <h1>President</h1>
      { test ? <TestBanner /> : "" }
      <div ref={this.svgRef}></div>
      <div class="board-container">
        <Results races={buckets.likelyD} hed="Dem. Likely" office="President"/>
        <Results races={buckets.tossup} hed="Lean/Tossup" office="President"/>
        <Results races={buckets.likelyR} hed="GOP Likely" office="President"/>
      </div>
      Results as of <DateFormatter value={latest}/>
    </>
  }

  async loadSVG(svgText) {
    this.svgRef.current.innerHTML = svgText;
    var svg = this.svgRef.current.getElementsByTagName("svg")[0];
    return svg;
  }
}
