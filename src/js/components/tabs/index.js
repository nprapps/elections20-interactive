import { h, Fragment, Component } from "preact";
import track from "../../lib/tracking";
import InlineSVG from "../inlineSVG";

export function Tab(props) {
  return <button
    role="tab"
    aria-controls={"tab-" + props.tab}
    aria-selected={props.selected}
    onClick={props.choose}
  >
    {props.icon && <InlineSVG alt="" src={props.icon} class="icon" />}
    {props.label}
  </button>
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
    var { id = 0, children } = props;
    var selected = children.find(c => c.props.selected);
    var selectedIndex = 0;
    if (selected) {
      selectedIndex = children.indexOf(selected);
    }
    this.state = {
      id,
      selected: selectedIndex || localStorage.getItem(`tabs-${id}`) || 0,
      clicked: false
    }
  }

  choose(selected) {
    localStorage.setItem(`tabs-${this.state.id}`, selected);
    this.setState({ selected, clicked: true });
    track("tab-selected", this.props.children[selected].props.label);
  }

  componentDidUpdate() {
    if (this.state.clicked) {
      this.base.querySelector(`#tab-${this.state.selected}`).focus({ preventScroll: true });
    }
  }

  render(props, state) {
    return <div>
      <div role="tablist" class="tabs">
        {props.children.map((c, i) => (
          <Tab icon={c.props.icon} label={c.props.label} tab={i} selected={state.selected == i} choose={() => this.choose(i)} />
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