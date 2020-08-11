import { Component, h } from "preact";
import { BigBoardCore } from "./includes/big-board-core.js";

import Scrapple from "@twilburn/scrapple";

var router = new Scrapple();

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
  }
};

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      route: "renderA",
      params: {}
    };

    this.router = new Scrapple();
    this.addRoute("/", "renderA");
    this.addRoute("/boards/:type", "renderBoards");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  renderBoards() {
    let currentBoard = this.state.params.type;
    return (
      <div class="board big-board">
        <BigBoardCore
          json={metaData[currentBoard].json}
          title={metaData[currentBoard].title}
        />
      </div>
    );
  }

  render(props, state) {
    return this[state.route]();
  }
}
