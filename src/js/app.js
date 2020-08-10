import { Component, h } from "preact";

import Scrapple from "@twilburn/scrapple";

var router = new Scrapple();

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      route: "renderA",
      params: {}
    }

    this.router = new Scrapple();
    this.addRoute("/", "renderA");
    this.addRoute("b", "renderB");
  }

  addRoute(path, route) {
    this.router.add(path, ({ params }) => {
      this.setState({ route, params });
    });
  }

  renderA() {
    return <div>hello A</div>
  }

  renderB() {
    return <div>hello B</div>
  }

  render(props, state) {
    return this[state.route]();
  }
}