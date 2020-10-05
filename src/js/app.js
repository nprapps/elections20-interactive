import { Component, h, Fragment } from "preact";

import { BigBoardCore } from './components/bigBoard';
import { GetCaughtUp } from './components/getCaughtUp';
import { StateResults } from './components/stateResults';

import Scrapple from "@twilburn/scrapple";

var metaData = {
  senate: {
    json: "senate-national.json",
    title: "Senate"
  },
  house: {
    json: "house-national.json",
    title: "House"
  },
  ballot: {
    json: "ballot-measures-national.json",
    title: "Ballot"
  },
  president: {
    json: "presidential-big-board.json",
    title: "President"
  }
};

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      route: "renderPresident",
      params: {}
    };

    this.router = new Scrapple();
    this.addRoute(["/", "/president"], "renderPresident")
    this.addRoute("/house", "renderHouse");
    this.addRoute("/senate", "renderSenate");
    this.addRoute("/governor", "renderGov");
    this.addRoute("/ballots", "renderBallots");
    this.addRoute("/states/:state", "renderState");
    this.addRoute("/states/:state/detail/:race", "renderCounty");
    this.addRoute("/states/:state/:subview", "renderState");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  renderPresident(props, state) {
    return (<>
      <h1>President</h1>
      <div class="placeholder">Map or dataviz</div>
      <div class="placeholder">Results by state</div>
    </>);
  }

  renderHouse(props, state) {
    return (<>
      <h1>Key House Results</h1>
      <div class="placeholder">Balance of Power</div>
      <div class="placeholder">Selected races</div>
    </>);
  }

  renderSenate(props, state) {
    return (<>
      <h1>Senate</h1>
      <div class="placeholder">State results by rating</div>
    </>);
  }

  renderGov(props, state) {
    return (<>
      <h1>Governor</h1>
      <div class="placeholder">State results</div>
    </>);
  }

  renderBallots(props, state) {
    return (<>
      <h1>Ballot Initiatives</h1>
      <div class="placeholder">Selected Ballots</div>
    </>);
  }

  renderState(props, state) {
    let currentState = state.params.state;
    // Default to key view
    let subview = state.params.subview || "president";
    let key = currentState + subview;
    return (
      <div id="state-results">
        <StateResults state={currentState.toUpperCase()} activeView={subview} key={key}/>
      </div>
    );
  }

  renderCounty(props, state) {
    console.log(props, state);
    return "COUNTY";
  }

  render(props, state) {
    console.log(props, state);
    return this[state.route](props, state);
  }
}
