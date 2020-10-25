import {expect} from "chai";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-preact-pure";
import regeneratorRuntime from "regenerator-runtime";
import 'jsdom-global/register';

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

import { h } from 'preact';
import { mount } from 'enzyme';

import ResultsTableCounty from "../src/js/components/resultsTableCounty";

describe("ResultsTableCounty", () => {
  it('returns if no data', () => {
    const wrapper = mount(<ResultsTableCounty data={''}/>);
    expect(wrapper.text()).to.equal('');
  });

  it('returns if no state-level candidates', () => {
    const wrapper = mount(<ResultsTableCounty data={{key: 'test'}}/>);
    expect(wrapper.text()).to.equal('');
  });
});