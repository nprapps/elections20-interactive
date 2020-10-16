import { h, Fragment, render, Component } from "preact";
import $ from "./lib/qsa";
import stateSheet from "states.sheet.json";
import Sidechain from "@nprapps/sidechain";

class Customizer extends Component {
  constructor() {
    super();
    this.state = {
      mode: "page",
      selectedState: "AK",
      selectedOffice: ""
    }

    this.selectStatePage = this.selectStatePage.bind(this);
    this.selectStateOffice = this.selectStateOffice.bind(this);
  }

  selectStatePage(e) {
    this.setState({ selectedState: e.target.value });
  }

  selectStateOffice(e) {
    this.setState({ selectedOffice: e.target.value })
  }

  render(props, state) {
    var postals = Object.keys(stateSheet).filter(s => !stateSheet[s].district);
    var modes = [
      ["page", "State page"],
      ["race", "Individual race"]
    ];

    var offices = [
      ["", "Key Races"],
      ["P", "President"],
      ["S", "Senate"],
      ["H", "House"],
      ["I", "Ballot initiatives"]
    ];

    var url = new URL(".", window.location.href).toString();
  
    return (<>
      <div class="mode-select">
      {modes.map(([data, label]) => (<>
        <input
          type="radio"
          name="mode"
          onInput={() => this.setState({ mode: data })}
          id={`mode-${data}`}
          checked={data == state.mode}
        />
        <label for={`mode-${data}`}>{label}</label>
      </>))}
      </div>
      {(() => {
        switch (state.mode) {
          case "page":
            var src = `${url}#/states/${state.selectedState}/${state.selectedOffice}`;
            return (<>
              <div class="state-select">
                <select value={state.selectedState} onInput={this.selectStatePage}>
                  {postals.map(s => <option value={s}>{stateSheet[s].name}</option>)}
                </select>
                <select value={state.selectedOffice} onInput={this.selectStateOffice}>
                  {offices.map(([data, label]) => (
                    <option value={data}>{label}</option>
                  ))}
                </select>
              </div>
              <side-chain 
                key={state.selectedState} 
                src={src} />
            </>);

          case "race":
            return "Individual race";
        }
      })()}
    </>)
  }
}

render(<Customizer />, $.one("main"));