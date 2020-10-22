import { h, Component, Fragment, createRef } from "preact";
import gopher from "../gopher.js";
// import "./countyData.less";
import { formatters, getCountyVariable } from "../util.js";
var { chain, comma, percent, dollars } = formatters;

export class CountyChart extends Component {
  constructor(props) {
    super();

    this.tooltipRef = createRef();
    this.svgRef = createRef();
    this.wrapperRef = createRef();
    this.onMove = this.onMove.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.margins = {
      top: 20,
      right: 5,
      bottom: 25,
      left: 30,
    };

    window.addEventListener("resize", this.handleResize);
  }

  // Lifecycle: Called whenever our component is created
  componentDidMount() {
    this.handleResize();
  }

  componentDidUpdate() {
    this.handleResize();
  }

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {}

  render() {
    if (!this.props.data) {
      return "";
    }

    return (
      <div class="graphic">
        {this.renderCorrelation()}
        <div class="graphic-wrapper" ref={this.wrapperRef}>
          {this.renderSVG()}
          <div class="tooltip" ref={this.tooltipRef}></div>
        </div>
      </div>
    );
  }

  renderCorrelation() {
    var relationships = [
      "almost no",
      "a weak",
      "moderate",
      "a strong",
      "a very strong",
    ];
    var index = Math.ceil(this.props.corr * relationships.length) - 1;
    return (
      <span class="description">
        There is <b>{relationships[index]}</b> relationship between{" "}
        <b> {this.props.title} </b> and party vote
      </span>
    );
  }

  renderSVG() {
    if (!this.state.dimensions) {
      return "";
    }
    var { width, height } = this.state.dimensions;
    return (
      <svg
        role="img"
        aria-description="Scatter plot"
        class="svg-flex"
        ref={this.svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${this.margins.left}, ${this.margins.top})`}>
          {this.createAxes()}
          {this.createDots()}
        </g>
      </svg>
    );
  }

  onLeave(e) {
    var tooltip = this.tooltipRef.current;
    tooltip.classList.remove("shown");
  }

  onMove(e) {
    var tooltip = this.tooltipRef.current;
    tooltip.classList.remove("shown");
    var data = this.props.data.filter(d => d.fips == e.target.dataset.fips)[0];

    var displayVar = data[this.props.variable];
    tooltip.innerHTML = `
        <div class="name">${data.countyName}</div>
        <div class="row">${this.props.title}: <span class="amt"> ${
      this.props.formatter ? this.props.formatter(displayVar) : displayVar
    }</span></div>`;

    var bounds = this.svgRef.current.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x + 1 > bounds.width / 2) {
      x -= 130;
      y += 10;
    } 
    tooltip.style.left = x + 20 + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }

  createAxes() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const [orderLess, orderMore] = this.props.order;

    var yLabel;
    if (this.props.variable == "past_margin") {
      yLabel = "More democratic →";
    } else {
      yLabel = `Higher ${this.props.title} →`;
    }

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
          y={-10}>
          {yLabel}
        </text>
        <text
          class="x axis-label"
          text-anchor="start"
          x={xStart}
          y={yStart + 15}>{`← More ${orderLess.party}`}</text>
        <text
          class="x axis-label"
          text-anchor="end"
          x={xEnd}
          y={yStart + 15}>{`More ${orderMore.party} →`}</text>
      </>
    );
  }

  createDots() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();

    return (
      <>
        <g className="dots">
          {this.props.data.map((t, i) => {
            var value = getCountyVariable(t, this.props.variable);
            const y = this.yScale(value);
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

  handleResize() {
    var newWidth = this.wrapperRef.current.offsetWidth;

    var chartWidth = newWidth - this.margins.left - this.margins.right;
    var chartHeight = newWidth - this.margins.top - this.margins.bottom;

    // Get min/max for Y axis
    var v = this.props.variable;
    var currV = this.props.data.map(function (d) {
      return getCountyVariable(d, v);
    });
    var maxY = Math.max.apply(Math, currV);
    var minY = Math.min.apply(Math, currV);
    maxY = Math.ceil(maxY * 100) / 100;
    minY = Math.floor(minY * 100) / 100;

    this.xScale = scaleFactory([0, 1], [0, chartWidth]);
    this.yScale = scaleFactory([minY, maxY], [chartHeight, 0]);

    var height = chartHeight + this.margins.top + this.margins.bottom;
    var width = chartWidth + this.margins.left + this.margins.right;

    if (!this.state.dimensions || newWidth != this.state.dimensions.width) {
      this.setState({
        dimensions: {
          width,
          height,
        },
      });
    }
  }
}

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
