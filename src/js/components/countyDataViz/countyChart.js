import { h, Component, Fragment, createRef } from "preact";
import gopher from "../gopher.js";
import "./countyData.less";

var scaleFactory = function (domain, range) {
  var [rangeStart, rangeEnd] = range;
  var rangeSize = rangeEnd - rangeStart;
  var [domainStart, domainEnd] = domain;
  var domainSize = domainEnd - domainStart;
  var scale = function (input) {
    var normalized = (input - domainStart) / domainSize;
    return normalized * rangeSize + rangeStart;
  };
  scale.range = () => range;
  var tickIntervals = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  scale.ticks = function () {
    for (var interval of tickIntervals) {
      var count = domainSize / interval;
      if (count > 3 && count < 10) {
        var ticks = [];
        var min = Math.floor(domainStart / interval) * interval;
        var max = Math.ceil(domainEnd / interval) * interval;
        for (var i = min; i <= max; i += interval) {
          ticks.push(i);
        }
        return ticks;
      }
    }
  };
  return scale;
};

export class CountyChart extends Component {
  constructor(props) {
    super();

    // TODO: don't show charts if not more than 5 counties are called? What to do
    // about Hawaii and other places with few counties?
    this.cleanedData = this.getCleanedData(
      props.data,
      props.variable,
      props.order
    );

    this.tooltipRef = createRef();
    this.onMove = this.onMove.bind(this);
    this.onLeave = this.onLeave.bind(this);

    this.chartWidth;
    this.chartHeight;
    this.margins = {
      top: 20,
      right: 25,
      bottom: 25,
      left: 50,
    };
  }

  // Lifecycle: Called whenever our component is created
  componentDidMount() {}

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.cleanedData) {
      return "";
    }
    // TODO: Move this elsewhere?
    var width = window.innerWidth / 3;
    var aspectWidth = 12;
    var aspectHeight = 9;
    this.chartWidth = width - this.margins.left - this.margins.right;
    this.chartHeight =
      Math.ceil((width * aspectHeight) / aspectWidth) -
      this.margins.top -
      this.margins.bottom;
    var maxY = Math.max.apply(
      Math,
      this.cleanedData.map(function (d) {
        return d.y;
      })
    );
    var minY = Math.min.apply(
      Math,
      this.cleanedData.map(function (d) {
        return d.y;
      })
    );
    maxY = Math.ceil(maxY / 10) * 10;
    minY = Math.floor(minY / 10) * 10;
    this.xScale = scaleFactory([0, 100], [0, this.chartWidth]);
    this.yScale = scaleFactory([minY, maxY], [this.chartHeight, 0]);

    return (
      <div class="graphic">
        <h4>{this.props.title}</h4>
        <ul></ul>
        <div class="graphic-wrapper">
          <svg
            width={this.chartWidth + this.margins.left + this.margins.right}
            height={this.chartHeight + this.margins.top + this.margins.bottom}>
            <g
              transform={`translate(${this.margins.left}, ${this.margins.top})`}>
              {this.createAxes()}
              {this.createDots()}
            </g>
          </svg>
          <div class="tooltip" ref={this.tooltipRef}></div>
        </div>
      </div>
    );
  }

  getCleanedData(data, variable, order) {
    var lead = order[0];
    var second = order[1];
    // TODO: is this the right cutoff?
    var filtered = data.filter(d => d.reportingPercent >= 0.5);
    var cleaned = filtered.map(f => ({
      name: f.county.countyName,
      x: this.getX(f, lead, second),
      y: f.county[variable],
      party: f.candidates[0].party,
      fips: f.fips,
      population: f.county.population,
      countyName: f.county.countyName,
    }));
    return cleaned;
  }

  onLeave(e) {
    var tooltip = this.tooltipRef.current;
    tooltip.classList.remove("shown");
  }

  onMove(e) {
    var tooltip = this.tooltipRef.current;
    console.log(e.target.dataset.fips);
    if (!e.target.dataset.fips) {
      console.log("here");
      tooltip.classList.remove("shown");
      return;
    }

    var data = this.cleanedData.filter(d => d.fips == e.target.dataset.fips)[0];

    tooltip.innerHTML = `
        <div class="name">${data.countyName}</div>
        <div class="pop">Pop. ${data.population}</div>
        <div class="reporting">${data.y}${this.props.title}</div>
      `;

    tooltip.style.left = e.clientX - 90 + "px";
    tooltip.style.top = e.clientY + 20 + "px";

    tooltip.classList.add("shown");
  }

  getX(county, lead, second) {
    // TODO: Verify this is correct
    var leadPer =
      county.candidates.filter(c => c.party == lead)[0].percent * 100;
    var secondPer =
      county.candidates.filter(c => c.party == second)[0].percent * 100;

    return (leadPer / (leadPer + secondPer)) * 100;
  }

  createAxes() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const ticksY = this.yScale.ticks();
    const [orderLeft, orderRight] = this.props.order;

    return (
      <>
        <line x1={xStart} x2={xEnd} y1={yStart} y2={yStart} stroke="#ccc" />
        <line x1={xStart} x2={xStart} y1={yEnd} y2={yStart} stroke="#ccc" />
        <line
          x1={xStart}
          x2={xEnd}
          y1={yStart / 2}
          y2={yStart / 2}
          stroke="#ccc"
        />
        <line x1={xEnd / 2} x2={xEnd / 2} y1={yEnd} y2={yStart} stroke="#ccc" />
        <text
          class="x axis-label"
          text-anchor="end"
          transform="rotate(-90)"
          x={0}
          dy=".35em"
          y={-10}>{`Higher ${this.props.title} →`}</text>
        <text
          class="x axis-label"
          text-anchor="start"
          x={xStart}
          y={yStart + 15}>{`← More ${this.props.order[1]}`}</text>
        <text
          class="x axis-label"
          text-anchor="end"
          x={xEnd}
          y={yStart + 15}>{`More ${this.props.order[0]} →`}</text>
      </>
    );
  }

  createDots() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const ticksY = this.yScale.ticks();

    var dots = [
      { x: 10, y: 20 },
      { x: 30, y: 10 },
    ];

    return (
      <>
        <g className="dots">
          {this.cleanedData.map((t, i) => {
            const y = this.yScale(t.y);
            const x = this.xScale(t.x);
            return (
              <circle
                onmousemove={this.onMove}
                onmouseout={this.onLeave}
                cx={x}
                cy={y}
                r="5"
                stroke="#ccc"
                stroke-width="1"
                class={t.party}
                data-fips={t.fips}
              />
            );
          })}
        </g>{" "}
      </>
    );
  }
}
