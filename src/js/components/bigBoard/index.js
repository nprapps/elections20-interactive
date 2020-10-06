// import { h, createProjector } from 'maquette';
import { h, Component, Fragment } from "preact";
import gopher from "../gopher.js";
import { RaceTable } from "../raceTable";
import { determineResults, decideLabel, getMetaData } from "../util.js";

export class BigBoardCore extends Component {
  constructor(props) {
    super();
    this.onData = this.onData.bind(this);
  }

  onData(json) {
    this.setState(json);
  }

  // Lifecycle: Called whenever our component is created
  async componentDidMount() {
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.json}`,
      this.onData
    );
    gopher.watch(
      `https://apps.npr.org/elections18-graphics/data/top-level-results.json`,
      this.onData
    );
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/${this.props.json}`,
      this.onData
    );
    gopher.unwatch(
      `https://apps.npr.org/elections18-graphics/data/top-level-results.json`,
      this.onData
    );
  }

  render() {
    if (!this.state.results || !this.state.house_bop) {
      return <div> "Loading..." </div>;
    } else if (false) {
      // TODO: replace this with a check for valid formatting?
      return <div></div>;
    }
    const results = this.getCleanedResults(this.state.results);

    // TODO: add in last updated to footer and senate footnote
    return (
      <div class="results-wrapper">
        <div class="results-header">
          <h1> {this.props.title} </h1>
          {this.renderTopLevel()}
        </div>
        <div class="results">
          <div class="column first">
            {results.firstCol.map((res) => this.renderResultsTable(res))}
          </div>
          <div class="column second">
            {results.secondCol.map((res) => this.renderResultsTable(res))}
          </div>
        </div>
        <div class="footer">
          <p>
            {" "}
            Source: AP <span>as of lastupdated ET</span>
          </p>
        </div>
      </div>
    );
  }

  renderResultsTable(column) {
    var races = column.races;

    if (races) {
      return (
        <Fragment>
          <h2 class="bucketed-group">
            <span>
              {isBucketedByTime(column["category"])
                ? column["category"] + " ET"
                : column["category"]}
              {column.overflow ? " (continued) " : ""}
            </span>
          </h2>
          <RaceTable races={races} />
        </Fragment>
      );
    } else {
      return <div></div>;
    }
  }

  renderTopLevel() {
    if (this.props.title.match(/^House/)) {
      var bop = this.state.house_bop;
      return this.renderCongressBOP(bop);
    } else if (this.props.title.indexOf("Senate") !== -1) {
      var bop = this.state.senate_bop;
      return this.renderCongressBOP(bop);
    }
    // else if (this.state.title.indexOf('President') !== -1) {
    //     var bop = bopData['electoral_college'];
    //     return renderElectoralBOP(bop);
    // }
    else {
      return <div class="leaderboard"></div>;
    }
  }

  renderCongressBOP(bop, chamber) {
    // TODO: refactor this to make cleaner
    const demSeats = bop["Dem"]["seats"];
    const gopSeats = bop["GOP"]["seats"];
    const indSeats = bop["Other"]["seats"];

    var netGain = 0;
    var netGainParty = "no-change";
    var netGainPartyLabel = "No change";
    var netGainTitle = "";
    var netGainExplanation = copyBop["pickups_" + chamber];

    if (bop["Dem"]["pickups"] > 0) {
      netGain = bop["Dem"]["pickups"];
      netGainParty = "dem";
      netGainPartyLabel = "Dem.";
      netGainTitle = copyBop["pickups_" + netGainParty];
      netGainTitle = netGainTitle.replace("___PICKUPS___", netGain);
    } else if (bop["GOP"]["pickups"] > 0) {
      netGain = bop["GOP"]["pickups"];
      netGainParty = "gop";
      netGainPartyLabel = "GOP";
      netGainTitle = copyBop["pickups_" + netGainParty];
      netGainTitle = netGainTitle.replace("___PICKUPS___", netGain);
    }

    const chamberWinner = bop["npr_winner"];
    const uncalledRaces = bop["uncalled_races"];

    return (
      <div class="leaderboard">
        <div class="results-header-group net-gain">
          <h2 class={"party " + netGainParty} title={netGainTitle}>
            <label>{copyBop["pickups_gain"]}</label>
            <abbr title={netGainTitle}>
              {netGain > 0 ? netGainPartyLabel + "+" + netGain : netGain}
            </abbr>
          </h2>
        </div>
        {this.getTopLevelHeaderGroup("Dem.", "Dem", demSeats)}
        {this.getTopLevelHeaderGroup("GOP.", "GOP", gopSeats)}
        {this.getTopLevelHeaderGroup("Ind.", "Other", indSeats)}
        {this.getTopLevelHeaderGroup(
          "Not Yet Called",
          "Not-Called",
          uncalledRaces
        )}
      </div>
    );
  }

  getTopLevelHeaderGroup(label, party, data, winner) {
    return (
      <div class={"results-header-group " + party.toLowerCase()}>
        <h2 class="party">
          <label>
            {winner === party ? <i class="icon.icon-ok"></i> : ""}
            {label}
          </label>
          <abbr>{data}</abbr>
        </h2>
      </div>
    );
  }

  getCleanedResults(resultsData) {
    // Get our data into a clean final format
    var numRaces = 0;
    let sortedCategories = [];

    // Sort results and extract the two races to display.
    for (let bucket in resultsData) {
      let sortedRaces = [];
      for (let races in resultsData[bucket]) {
        numRaces += 1;
        var raceLabel = decideLabel(resultsData[bucket][races][0]);
        var raceResults = determineResults(resultsData[bucket][races]);
        var metadata = getMetaData(raceResults);
        Object.assign(raceResults, metadata);

        var race = { label: raceLabel, results: raceResults };

        sortedRaces.push(race);
      }
      sortedRaces = sortedRaces.sort((a, b) => (a.label > b.label ? 1 : -1));
      sortedCategories.push({ category: bucket, races: sortedRaces });
    }
    sortedCategories = this.sortBuckets(sortedCategories);

    // Make two roughly equal length columns from the results.
    const breakingIndex = Math.ceil(numRaces / 2);
    let raceIndex = 0;

    for (let i = 0; i < sortedCategories.length; i++) {
      raceIndex += sortedCategories[i].races.length;
      if (raceIndex >= breakingIndex) {
        if (raceIndex > breakingIndex) {
          var leftover = raceIndex - breakingIndex;
          var keep = sortedCategories[i].races.length - leftover;
          var carryOverCategory = JSON.parse(
            JSON.stringify(sortedCategories[i])
          );
          carryOverCategory.races = carryOverCategory.races.slice(
            keep,
            sortedCategories[i].races.length + 1
          );
          carryOverCategory.overflow = true;
          sortedCategories.splice(i + 1, 0, carryOverCategory);
          sortedCategories[i].races = sortedCategories[i].races.slice(
            0,
            keep - 1
          );
        }
        return {
          firstCol: sortedCategories.slice(0, i + 1),
          secondCol: sortedCategories.slice(i + 1, sortedCategories.length + 1)
        };
      }
    }

    return sortedCategories;
  }

  sortBuckets(buckets) {
    return isBucketedByTime(buckets[0].category)
      ? buckets.sort(function (a, b) {
          var aHour = parseInt(a.category.split(":")[0]);
          var bHour = parseInt(b.category.split(":")[0]);

          if (a.category.slice(-4) === "a.m.") return 1;
          if (b.category.slice(-4) === "a.m.") return -1;
          if (aHour === bHour && a.category.indexOf("30") !== -1) return 1;
          if (aHour === bHour && b.category.indexOf("30") !== -1) return -1;
          else return aHour - bHour;
        })
      : buckets.sort((a, b) => (a.category > b.category ? 1 : -1));
  }
}

// TODO: make this a regex
const isBucketedByTime = (bucket) =>
  bucket.includes(":") && (bucket.includes("a.m.") || bucket.includes("p.m."));
