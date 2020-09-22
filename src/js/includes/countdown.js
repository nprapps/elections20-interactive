import gopher from "../gopher.js";
import { Component, h } from "preact";

export default class Countdown extends Component {
  constructor() {
    super();
    this.state = {
      counter: gopher.interval,
      text: ""
    };
    this.timeout = null;
    this.start = this.start.bind(this);
    this.tick = this.tick.bind(this);
    gopher.addEventListener("schedule", this.start);
    setTimeout(this.tick, 1000);
  }

  start() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.tick, 1000);
  }

  tick() {
    var { scheduled } = gopher;
    var anticipation = (scheduled - Date.now()) / 1000;
    var text = "0:" + String(Math.round(anticipation)).padStart(2, 0);
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.tick, 1000);
    this.setState({ text });
  }

  render(props, state) {
    return <div class="indicator">
      <b class={"icon icon-spin3" + (state.running ? "animate-spin" : "")}></b>
      <span class="text">{state.text}</span>
    </div>
  }
}