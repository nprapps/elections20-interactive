import { h, Fragment, Component } from "preact";

export function Tab(props) {
  return <button
    role="tab"
    aria-controls={"tab-" + props.tab}
    aria-selected={props.selected}
    onClick={props.choose}
  >{props.label}</button>
}

export function Panel(props) {
  return <div
    class={props.shown ? "active" : "inactive"}
    role="tabpanel" tabindex="-1"
    aria-hidden={!props.shown}
    id={"tab-" + props.id}>
    {props.children}
  </div>
}

export default class Tabs extends Component {
  constructor(props) {
    super();
    var id = props.id || 0;
    this.state = {
      id,
      selected: localStorage.getItem(`tabs-${id}`) || 0,
      clicked: false
    }
  }

  choose(selected) {
    localStorage.setItem(`tabs-${this.state.id}`, selected);
    this.setState({ selected, clicked: true });
  }

  componentDidUpdate() {
    if (this.state.clicked) {
      this.base.querySelector(`#tab-${this.state.selected}`).focus();
    }
  }

  render(props, state) {
    return <div>
      <div role="tablist" class="tabs">
        {props.children.map((c, i) => (
          <Tab label={c.props.label} tab={i} selected={state.selected == i} choose={() => this.choose(i)} />
        ))}
      </div>
      <div class="tabgroup">
        {props.children.map((c, i) => (
          <Panel id={i} shown={state.selected == i}>{c}</Panel>
        ))}
      </div>
    </div>
  }
}