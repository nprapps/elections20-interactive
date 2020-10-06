/*
 THIS FILE IS DEPRECATED
 We probably won't use this component in the final presentation.
 If you find yourself using it, remove this warning and talk to
 the team about it.
*/

import gopher from "../gopher.js";
import { Component, h } from "preact";

export default class Countdown extends Component {
  constructor() {
    super();
    this.state = {
      text: "",
      loading: false
    };
    this.timeout = null;
    this.start = this.start.bind(this);
    this.tick = this.tick.bind(this);
    gopher.addEventListener("schedule", this.start);
    gopher.addEventListener("sync-start", () => this.setState({ loading: true }));
    gopher.addEventListener("sync-end", () => this.setState({ loading: false }));
    setTimeout(this.tick, 1000);
  }

  start() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.tick, 1000);
  }

  tick() {
    var { scheduled } = gopher;
    var anticipation = (scheduled - Date.now()) / 1000;
    if (anticipation < 0) anticipation = gopher.interval;
    var text = "0:" + String(Math.round(anticipation)).padStart(2, 0);
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(this.tick, 1000);
    this.setState({ text });
  }

  render(props, state) {
    return <div class="countdown-indicator">
      <img alt="" src="./assets/icons/update.svg" class={state.loading ? "animate-spin" : ""} />
      <span class="text">{state.loading ? "Loading..." : state.text}</span>
    </div>
  }
}