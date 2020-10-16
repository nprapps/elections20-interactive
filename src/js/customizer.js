import { h, Fragment, render, Component } from "preact";
import $ from "./lib/qsa";
import stateSheet from "states.sheet.json";
import strings from "strings.sheet.json";
import Sidechain from "@nprapps/sidechain";

class Customizer extends Component {
  constructor() {
    super();
    this.state = {
      mode: "page",
      selectedState: "AK",
      selectedOffice: "",
      races: [],
      raceID: null
    }

    this.selectStatePage = this.selectStatePage.bind(this);
    this.selectStateOffice = this.selectStateOffice.bind(this);
    this.loadStateRaces = this.loadStateRaces.bind(this);
    this.selectRace = this.selectRace.bind(this);
  }

  componentDidMount() {
    this.loadStateRaces(this.state.selectedState);
  }

  selectStatePage(e) {
    this.setState({ selectedState: e.target.value, selectedOffice: null });
    this.loadStateRaces(e.target.value);
  }

  selectStateOffice(e) {
    this.setState({ selectedOffice: e.target.value })
  }

  selectRace(e) {
    this.setState({ raceID: e.target.value })
  }

  async loadStateRaces(state) {
    this.setState({ races: [], raceID: null })
    var response = await fetch(`./data/states/${state}.json`);
    var json = await response.json();
    this.setState({ races: json.results });
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
          onInput={() => this.setState({ mode: data, selectedOffice: null })}
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
            var src = "";
            if (state.raceID) {
              var assembly = new URL(url + "./embed.html");
              assembly.searchParams.set("file", `states/${state.selectedState}`);
              assembly.searchParams.set("race", state.raceID);
              src = assembly.toString();
            }
            return (<>
              <div class="state-select">
                <select value={state.selectedState} onInput={e => this.loadStateRaces(e.target.value)}>
                  {postals.map(s => <option value={s}>{stateSheet[s].name}</option>)}
                </select>
                <select value={state.selectedRace} onInput={this.selectRace}>
                  <option value="">Select an office</option>
                  {state.races.map(r => <option value={r.id}>
                    {`${strings["office-" + r.office]} ${r.seat ? r.seat : ""}`}
                  </option>)}
                </select>
              </div>
              {state.raceID && 
                <side-chain
                  key={state.raceID}
                  src={src}
                />
              }
            </>);
        }
      })()}
    </>)
  }
}

render(<Customizer />, $.one("main"));