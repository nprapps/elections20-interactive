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
      route: "renderGetCaughtUp",
      params: {}
    };

    this.router = new Scrapple();
    this.addRoute("/boards/:type", "renderBoards");
    this.addRoute("/get-caught-up", "renderGetCaughtUp");
    this.addRoute("/states/:state/:subview", "renderState");
    this.addRoute("/states/:state", "renderState");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  renderBoards(props, state) {
    let currentBoard = state.params.type;
    return (
      <div class="board big-board">
        <BigBoardCore
          json={metaData[currentBoard].json}
          title={metaData[currentBoard].title}
        />
      </div>
    );
  }

  renderState(props, state) {
    let currentState = state.params.state;
    // Default to key view
    let subview = state.params.subview || "key";
    let key = currentState + subview;
    return <div id="state-results">
            <StateResults state={currentState.toUpperCase()} activeView={subview} key={key}/>
          </div>
  }

  renderGetCaughtUp(props, state) {
    return <div class="get-caught-up-wrapper">
            <GetCaughtUp />
          </div>
  }

  render(props, state) {
    return this[state.route](props, state);
  }
}
