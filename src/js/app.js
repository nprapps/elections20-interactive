import { Component, h, Fragment } from "preact";
import Scrapple from "./scrapple";
import "./components/ad";

import BoardGovernor from "./components/boardGovernor";
import BoardHouse from "./components/boardHouse";
import BoardPresident from "./components/boardPresident";
import BoardSenate from "./components/boardSenate";
import BoardBallot from "./components/boardBallot";
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
    // this.router.onhit = () => {};

    this.addView(["/", "/president"], BoardPresident);
    this.addView("/house", BoardHouse);
    this.addView("/governor", BoardGovernor);
    this.addView("/senate", BoardSenate);
    this.addView("/ballots", BoardBallot);
    this.addView("/states/:state", StateResults);
    this.addView("/states/:state/:subview", StateResults);

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

  componentDidUpdate(_, state) {
    if (this.base && this.state.route != state.route || this.state.View != state.view) {
      var headline = this.__P.querySelector("h1, h2");
      if (headline) {
        headline.focus();
        console.log(`Updating route focus to "${headline.textContent}"`)
      }
    }
  }

  loading() {
    return <span>"Loading..."</span>;
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
    return <span></span>;
  }
}
