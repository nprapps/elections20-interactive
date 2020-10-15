import { h, Component, Fragment, createRef } from "preact";
import gopher from "../gopher.js";
import "./countyData.less";
import { formatters } from "../util.js";
var { chain, comma, percent, dollars } = formatters;

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

    this.tooltipRef = createRef();
    this.svgRef = createRef();
    this.wrapperRef = createRef();
    this.onMove = this.onMove.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.chartWidth;
    this.chartHeight;
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

  // Lifecycle: Called just before our component will be destroyed
  componentWillUnmount() {
    // stop when not renderable
  }

  render() {
    if (!this.props.data) {
      return "";
    }

    return (
      <div class="graphic">
        <h4>{this.props.title}</h4>
        <div class="graphic-wrapper" ref={this.wrapperRef}>
          {this.renderCorrelation()}
          {this.renderSVG()}
          <div class="tooltip" ref={this.tooltipRef}></div>
        </div>
      </div>
    );
  }

  renderCorrelation() {
    if (!this.state.dimensions) {
      return "";
    }
    var correlation = getPearsonCorrelation(
      this.props.data.map(d => d.x),
      this.props.data.map(d => parseFloat(d[this.props.variable]))
    );
    correlation = Math.abs(correlation);
    var width = this.state.dimensions.width;

    return (
      <svg width={width} height="40" viewBox={`0 0 ${width} 40`}>
        <line class="trend-line" x1="30" x2={width} y1="10" y2="10" preserveAspectRatio="xMaxYMid meet"></line>
        <circle cx={30 + (width-30) * correlation}
                cy="10"
                r="5"></circle>
        <text class="axis-label" text-anchor="start" x="30" y="30">
          ← Weaker
        </text>
        <text class="axis-label" text-anchor="end" x={width - 5} y="30">
          Stronger →
        </text>
      </svg>
    );
  }

  renderSVG() {
    if (!this.state.dimensions) {
      return "";
    }
    // TODO: Move this elsewhere?
    var width = this.state.dimensions.width;
    this.chartWidth = width - this.margins.left - this.margins.right;
    this.chartHeight = width - this.margins.top - this.margins.bottom;

    var v = this.props.variable;
    var maxY = Math.max.apply(
      Math,
      this.props.data.map(function (d) {
        return d[v];
      })
    );
    var minY = Math.min.apply(
      Math,
      this.props.data.map(function (d) {
        return d[v];
      })
    );
    maxY = Math.ceil(maxY / 10) * 10;
    minY = Math.floor(minY / 10) * 10;
    this.xScale = scaleFactory([0, 100], [0, this.chartWidth]);
    this.yScale = scaleFactory([minY, maxY], [this.chartHeight, 0]);

    var height = this.chartHeight + this.margins.top + this.margins.bottom;
    var width = this.chartWidth + this.margins.left + this.margins.right;
    return (
      <svg
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

    // TODO: make the formmaters handle the correct var
    var displayVar = parseFloat(data[this.props.variable]).toFixed(1);
    tooltip.innerHTML = `
        <div class="name">${data.countyName}</div>
        <div class="pop">Pop. ${comma(data.population)}</div>
        <div class="reporting">${displayVar} ${this.props.title}</div>`;

    var bounds = this.svgRef.current.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= tooltip.offsetWidth + 10;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }

  createAxes() {
    const [xStart, xEnd] = this.xScale.range();
    const [yStart, yEnd] = this.yScale.range();
    const ticksY = this.yScale.ticks();
    const [orderMore, orderLess] = this.props.order;

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
    const ticksY = this.yScale.ticks();

    var dots = [
      { x: 10, y: 20 },
      { x: 30, y: 10 },
    ];

    return (
      <>
        <g className="dots">
          {this.props.data.map((t, i) => {
            const y = this.yScale(t[this.props.variable]);
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
    this.setState({
      dimensions: {
        width: this.wrapperRef.current.offsetWidth,
      },
    });
  }
}

/* TODO: figure out if we can use this or if it needs to be cited more strongly?
 *  Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
 */
function getPearsonCorrelation(x, y) {
  var shortestArrayLength = 0;
  if (x.length == y.length) {
    shortestArrayLength = x.length;
  } else if (x.length > y.length) {
    shortestArrayLength = y.length;
    console.error(
      "x has more items in it, the last " +
        (x.length - shortestArrayLength) +
        " item(s) will be ignored"
    );
  } else {
    shortestArrayLength = x.length;
    console.error(
      "y has more items in it, the last " +
        (y.length - shortestArrayLength) +
        " item(s) will be ignored"
    );
  }
  var xy = [];
  var x2 = [];
  var y2 = [];
  for (var i = 0; i < shortestArrayLength; i++) {
    xy.push(x[i] * y[i]);
    x2.push(x[i] * x[i]);
    y2.push(y[i] * y[i]);
  }
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_x2 = 0;
  var sum_y2 = 0;
  for (var i = 0; i < shortestArrayLength; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += xy[i];
    sum_x2 += x2[i];
    sum_y2 += y2[i];
  }
  var step1 = shortestArrayLength * sum_xy - sum_x * sum_y;
  var step2 = shortestArrayLength * sum_x2 - sum_x * sum_x;
  var step3 = shortestArrayLength * sum_y2 - sum_y * sum_y;
  var step4 = Math.sqrt(step2 * step3);
  var answer = step1 / step4;
  return answer;
}
