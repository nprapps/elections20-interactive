import { h, render, Fragment } from "preact";
import $ from "./lib/qsa";
import ResultsTableCandidates from "./components/resultsTableCandidates";
import strings from "strings.sheet.json";

import Sidechain from "@nprapps/sidechain";
var guest = Sidechain.registerGuest();

var search = new URLSearchParams(window.location.search);

var params = {
  file: null,
  race: null,
  county: null,
  theme: null,
  seat: null,
  linkless: null
};

for (var k in params) params[k] = search.get(k);

init();

async function init() {
  if (!params.file) return console.log("Bad command or file name");
  var response = await fetch(`./data/${params.file}.json`);
  var json = await response.json();
  var results = json instanceof Array ? json : json.results;
  if (params.race) {
    results = results.filter(r => r.id == params.race);
  }
  var container = $.one("main.embed");
  var template = <>
    {results.map(function(r) {
      var office = strings["office-" + r.office];
      return (<>
        <ResultsTableCandidates data={r} title={office} />
        {!params.linkless && <a 
          class="see-full"
          target="_blank"
          href={`https://apps.npr.org/elections20-interactive/#/states/${r.state}/${r.office}`}>
            See full results &rsaquo;
        </a>}
      </>);
    })}
  </>;
  render(template, container);
}