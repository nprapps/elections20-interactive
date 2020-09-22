import gopher from "../gopher.js";
import { Component, h } from "preact";

export default class Countdown extends Component {
  constructor() {
    super();
    this.state = {
      counter: gopher.interval,
      timeout: null,
      text: ""
    };
    this.start = this.start.bind(this);
    this.tick = this.tick.bind(this);
    gopher.addEventListener("tick", this.start);
    setTimeout(this.tick, 1000);
  }

  start(counter) {
    var { timeout } = this.state;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(this.tick, 1000);
    this.setState({ counter, timeout });
  }

  tick() {
    var { counter, timeout } = this.state;
    var text = "0:" + String(counter).padStart(2, 0);
    counter--;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (counter) timeout = setTimeout(this.tick, 1000);
    this.setState({ counter, text, timeout });
  }

  render(props, state) {
    return <div class="indicator">
      <b class={"icon icon-spin3" + (state.running ? "animate-spin" : "")}></b>
      <span class="text">{state.text}</span>
    </div>
  }
}