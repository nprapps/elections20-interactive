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
              <h2>Embeds</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 8px">
                <div>
                  <h3>Pym</h3>
                  <textarea rows="6" style="width:100%">
                  {`<p
                    data-pym-loader
                    data-child-src="${src}"
                    id="responsive-embed-election-${state.selectedState}-${state.selectedOffice || "X"}">
                      Loading...
                  </p>
                  <script src="https://pym.nprapps.org/npr-pym-loader.v2.min.js"></script>`.replace(/\s{2,}|\n/g, " ")}
                  </textarea>
                </div>
                <div>
                  <h3>Sidechain</h3>
                  <textarea rows="6" style="width:100%">
                  {`<side-chain src="${src}"></side-chain>
                  <script src="https://apps.npr.org/elections20-interactive/sidechain.js"></script>`.replace(/\s{2,}|\n/g, " ")}
                  </textarea>
                </div>
              </div>
              <h2>Preview</h2>
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
              {state.raceID && <>
                <h2>Embeds</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 8px">
                  <div>
                    <h3>Pym</h3>
                    <textarea rows="6" style="width:100%">
                    {`<p
                      data-pym-loader
                      data-child-src="${src}"
                      id="responsive-embed-election-${state.selectedState}-${state.raceID}">
                        Loading...
                    </p>
                    <script src="https://pym.nprapps.org/npr-pym-loader.v2.min.js"></script>`.replace(/\s{2,}|\n/g, " ")}
                    </textarea>
                  </div>
                  <div>
                    <h3>Sidechain</h3>
                    <textarea rows="6" style="width:100%">
                    {`<side-chain src="${src}"></side-chain>
                    <script src="https://apps.npr.org/elections20-interactive/sidechain.js"></script>`.replace(/\s{2,}|\n/g, " ")}
                    </textarea>
                  </div>
                </div>
                <h2>Preview</h2>
                <side-chain
                  key={state.raceID}
                  src={src}
                />
              </>}
            </>);
        }
      })()}
    </>)
  }
}

render(<Customizer />, $.one("main"));