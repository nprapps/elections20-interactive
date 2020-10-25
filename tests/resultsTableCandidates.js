import { expect } from "chai";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-preact-pure";
import regeneratorRuntime from "regenerator-runtime";
import "jsdom-global/register";
import * as data from "../build/data/states/CA.json";
import {reportingPercentage} from "../src/js/components/util.js"

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

import ResultsTableCandidates from "../src/js/components/resultsTableCandidates";

describe("ResultsTableCandidates", () => {
  data.results.forEach(function (race) {
    it(`${race.id}: returns if no data`, () => {
      const wrapper = mount(<ResultsTableCandidates data={""} />);
      expect(wrapper.text()).to.equal("");
    });

    it(`${race.id}: returns if no candidates`, () => {
      const wrapper = mount(<ResultsTableCandidates data={{ key: "test" }} />);
      expect(wrapper.text()).to.equal("");
    });

    it(`${race.id}: has correct % in/reporting`, () => {
      const wrapper = mount(<ResultsTableCandidates data={race} />);
      // Should ballot initiatives be % reporting?
      if (["P", "S"].includes(race.office)) {
        var percent = reportingPercentage(race.eevp)
        expect(wrapper.text()).to.include(`${percent}% in`);
      } else {
        var percent = reportingPercentage(race.reportingPercent)
        expect(wrapper.text()).to.include(`${percent}% reporting`);
      }
    });

    // it("adds correct party after candidates", () => {
    //   const wrapper = mount(<ResultsTableCandidates data={race} />);
    //   expect(wrapper.text()).to.include("Joe Biden (Dem)");
    //   expect(wrapper.text()).to.include("Donald Trump (GOP)");
    //   expect(wrapper.text()).to.include("Jo Jorgensen (Ind)");
    //   expect(wrapper.text()).to.include("Other Candidates");
    // });

    it(`${race.id}: renders all candidates`, () => {
      const wrapper = mount(<ResultsTableCandidates data={race} />);
      var candidates = wrapper.find(".tr.candidate");
      expect(candidates.length).to.equal(race.candidates.length);
    });

    it(`${race.id}: % vote sums to 100%`, () => {
      const wrapper = mount(<ResultsTableCandidates data={race} />);
      var candidates = wrapper.find(".tr.candidate");
      var sum = 0;
      for (let cand of candidates.find(".percentage")) {
        sum += cand.props.children.slice(0, -1) * 1;
      }
      expect(sum).to.equal(100);
    });

    it(`${race.id}: if called, one winner gets checkmark`, () => {
      const wrapper = mount(<ResultsTableCandidates data={race} />);
      var winner = wrapper.find(".tr.candidate.winner").find(".winner-icon");
      if (race.called) expect(winner.length).to.equal(1);
      if (!race.called) expect(winner.length).to.equal(0);
    });
  });
});
