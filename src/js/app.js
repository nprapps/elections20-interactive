import { Component, h, Fragment } from "preact";
import Scrapple from "@twilburn/scrapple";

import BoardGovernor from "./components/boardGovernor";
import BoardHouse from "./components/boardHouse";
import BoardPresident from "./components/boardPresident";
import BoardSenate from "./components/boardSenate";
import CountyResults from "./components/countyResults";
import StateResults from "./components/stateResults";

var guid = 0;

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
    this.addView("/states/:state", StateResults);
    this.addView("/states/:state/:subview", StateResults);
    this.addRoute("/ballots", "renderBallots");
    this.addRoute("/states/:state/detail/:race", "renderCounty");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  addView(path, View) {
    this.router.add(path, ({ url, params }) => {
      this.setState({ route: null, params, View, url });
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
      return <state.View {...state.params} key={state.url}/>
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
