import { h, Component, Fragment, createRef } from "preact";
import gopher from "../gopher.js";
// import "./countyDataViz.less";
import { scaleLinear } from "d3";
import "./countyData.less"

export class CountyChart extends Component {
  constructor(props) {
    super();

    // TODO: don't show charts if not more than 5 counties are called? What to do
    // about Hawaii and other places with few counties?
    this.cleanedData = this.getCleanedData(props.data, props.variable);

    this.tooltipRef = createRef();

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
  componentDidMount() {
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
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
    maxY = Math.ceil(maxY / 10) * 10;
    this.xScale = scaleLinear().domain([0, 100]).range([0, this.chartWidth]);
    this.yScale = scaleLinear().domain([0, maxY]).range([this.chartHeight, 0]);

    return (
      <div class="graphic">
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
          <div id="tooltip" ref={this.tooltipRef}></div>
        </div>
      </div>
    );
  }

  getCleanedData(data, variable) {
    // Only show on chart if winner declared
    // TODO: something fancier on calculation for more/less dem
    var filtered = data.filter(d => d.winnerParty);
    var cleaned = filtered.map(f => ({
      name: f.county.countyName,
      x: (100 - f.candidates.filter(c => c.party == "GOP")[0].percent * 100),
      y: f.county[variable], // Will need to fix this
      party: f.candidates[0].party,
    }));
    return cleaned;
  }

  createAxes() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const ticksY = this.yScale.ticks();
    const ticksX = this.xScale.ticks();

    return (
      <>
        <g className="ticks">
          {ticksY.map((t, i) => {
            const y = this.yScale(t);
            return (
              <Fragment key={i}>
                <text
                  x={xStart - 20}
                  y={y}
                  fill="#999"
                  textAnchor="middle"
                  fontSize={10}>
                  {t}
                </text>
              </Fragment>
            );
          })}
        </g>{" "}
        <line x1={xStart} x2={xEnd} y1={yStart} y2={yStart} stroke="#ccc" />
        <line x1={xStart} x2={xStart} y1={yEnd} y2={yStart} stroke="#ccc" />
      </>
    );
  }

  createDots() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const ticksY = this.yScale.ticks();
    const ticksX = this.xScale.ticks();

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
                cx={x}
                cy={y}
                r="4"
                stroke="#ccc"
                stroke-width="1"
                class={t.party}
              />
            );
          })}
        </g>{" "}
      </>
    );
  }
}
