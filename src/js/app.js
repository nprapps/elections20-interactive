import { Component, h } from "preact";

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
    this.addRoute("/governors", "renderGov");
    this.addRoute("/ballots", "renderBallot");
    this.addRoute("/states/:state/detail/:race", "renderCounty");
    this.addRoute("/states/:state/:subview?", "renderState");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  renderPresident(props, state) {
    console.log(props, state);
    return "PRESIDENT";
  }

  renderHouse(props, state) {
    console.log(props, state);
    return "HOUSE";
  }

  renderSenate(props, state) {
    console.log(props, state);
    return "SENATE";
  }

  renderBallots(props, state) {
    console.log(props, state);
    return "BALLOTS";
  }

  renderCounty(props, state) {
    console.log(props, state);
    return "COUNTY";
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

  render(props, state) {
    console.log(state.route);
    return this[state.route](props, state);
  }
}
