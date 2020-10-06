import { Component, h, Fragment } from "preact";

import { BigBoardCore } from "./components/bigBoard";
import { GetCaughtUp } from "./components/getCaughtUp";
import { StateResults } from "./components/stateResults";
import { CountyResults } from "./components/countyResults";
import BoardSenate from "./components/boardSenate";
import BoardHouse from "./components/boardHouse";
import BoardPresident from "./components/boardPresident";
import BoardGovernor from "./components/boardGovernor";

import Scrapple from "@twilburn/scrapple";

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      route: "loading",
      params: {},
      View: null
    };

    this.router = new Scrapple();
    this.router.onhit = () => {};
    this.addView(["/", "/president"], BoardPresident);
    this.addView("/house", BoardHouse);
    this.addView("/governor", BoardGovernor);
    this.addView("/senate", BoardSenate);
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

  addView(path, View) {
    this.router.add(path, ({ params }) => {
      this.setState({ route: null, params, View });
    });
  }

  renderBallots(props, state) {
    return (
      <>
        <h1>Ballot Initiatives</h1>
        <div class="placeholder">Selected Ballots</div>
      </>
    );
  }

  renderState(props, state) {
    let currentState = state.params.state;
    // Default to key view
    let subview = state.params.subview || "president";
    let key = currentState + subview;
    return (
      <div id="state-results">
        <StateResults state={currentState} activeView={subview} key={key} />
      </div>
    );
  }

  renderCounty(props, state, race) {
    let currentState = state.params.state;
    return (
      <>
        <div id="county-results">
          <CountyResults state={currentState} raceid={state.params.race} />
        </div>
        <div class="placeholder">Demographic/results dataviz</div>
      </>
    );
  }

  loading() {
    return "Loading...";
  }

  render(props, state) {
    // use a View component
    if (!state.route && state.View) {
      console.log(`Loaded page component: ${state.View.name}`);
      return <state.View {...state.params} />
    }

    // otherwise call a route method
    if (this[state.route]) {
      console.log(`Loading local view method: ${state.route}()`);
      return this[state.route](props, state);
    }

    // otherwise fall back to nothing
    return "";
  }
}
