import { expect } from "chai";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-preact-pure";
import regeneratorRuntime from "regenerator-runtime";
import "jsdom-global/register";
import * as data from "../build/data/counties/HI-0.json";
import * as stateData from "../build/data/states/HI.json";

// import proxyquire from 'proxyquireify';
// var proxyquire = require("proxyquireify")(require)

// var stubs = {
//   'inactive_senate_races.sheet.json': {
//       wunder: function () { return 'wirklich wunderbar'; }
//     , kinder: function () { return 'schokolade'; }
//   }
// };
// var BalanceOfPower = proxyquire('../src/js/components/balanceOfPower', stubs);

configure({ adapter: new Adapter() });

import { h } from "preact";
import { mount } from "enzyme";

import { ResultsRowCounty } from "../src/js/components/resultsTableCounty";
import ResultsTableCounty from "../src/js/components/resultsTableCounty";

describe("ResultsTableCounty", () => {
  it("returns if no data", () => {
    const wrapper = mount(<ResultsTableCounty data={""} />);
    expect(wrapper.text()).to.equal("");
  });

  // it("returns if no state-level candidates", () => {
  //   const wrapper = mount(<ResultsTableCounty data={{ key: "test" }} />);
  //   expect(wrapper.text()).to.equal("");
  // });

  it(`if 100% in, one candidate gets colored`, () => {
    for (let race of data.results) {
      var orderedCandidates = stateData.results.filter(d => d.office == race.office)[0]
        .candidates;
      const wrapper = mount(
        <ResultsRowCounty
          key={race.fips}
          candidates={orderedCandidates}
          row={race}
          metric={"population"}
        />
      );
      var winner = wrapper.find(".vote.leading");
      if (race.reportingPercent >= 1) expect(winner.length).to.equal(1);
      if (race.reportingPercent < 1) expect(winner.length).to.equal(0);
    }
  });
});
