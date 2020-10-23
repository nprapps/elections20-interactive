import { h, Fragment } from "preact";

var sum = list => list.reduce((t, r) => t + r.electoral, 0);

function* Snake(width) {
  var row = 0;
  var column = 0;
  yield { row, column };

  while(true) {
    column += row % 2 ? -1 : 1;
    if (column < 0) {
      row++;
      column = 0;
    }
    if (column >= width) {
      row++;
      column = width - 1;
    }
    yield { row, column };
  }
}

function Grid(props) {

  var { races, width = 15, min = 270 } = props;
  var cellSize = 20;
  var textSize = cellSize * .7;
  var victoryRow = 270 / width;

  var last = a => a[a.length - 1];
  var middle = a => a[a.length >> 1];
  var avg = a => a.reduce((t, v) => t + v, 0) / a.length;

  var grid = [];
  var poke = function(r, c, v) {
    if (!grid[r]) grid[r] = [];
    grid[r][c] = v;
  }

  var peek = function(r, c) {
    if (!grid[r]) return null;
    return grid[r][c] || null;
  }

  var snake = Snake(width);

  // merge the states
  var states = {};
  races.forEach(function(r) {
    if (states[r.state]) {
      states[r.state].electoral += r.electoral;
    } else {
      states[r.state] = { ...r };
    }
  });

  var merged = Object.keys(states).sort().reverse().map(k => states[k]);

  var shapes = merged.map(function(r) {
    var cells = [];
    var { state } = r;
    var [ winner, loser ] = r.candidates;
    var margin = winner.percent - loser.percent;
    for (var i = 0; i < r.electoral; i++) {
      var c = snake.next().value;
      cells.push(c);
      poke(c.row, c.column, state);
    }
    return {
      data: r,
      state,
      margin,
      cells
    }
  });

  if (!shapes.length) return;

  var topShape = last(shapes);
  var rows = Math.max(min / width, victoryRow, last(topShape.cells).row) + 1;

  var lines = [];
  for (var i = 1; i < rows; i++) {
    lines.push(i);
  }

  var svgWidth = width * cellSize + 20;
  var svgHeight = rows * cellSize;

  return (<div class={"stack " + props.class}>
    <svg
      width={svgWidth}
      height={svgHeight}
      preserveAspectRatio="xMidYMid meet"
      viewBox={[0,0,svgWidth,svgHeight].join(" ")}
      >
      {lines.map(g => (
        <line 
          x1={0} x2={svgWidth}
          y1={(rows - g) * cellSize} y2={(rows - g) * cellSize}
          class="grid"
        />
      ))}      {shapes.map(function(shape, i) {
        var [ labelCell = { row: 0, column: 0 }] = shape.cells;
        return <>
          <g data-state={shape.label} data-count={shape.cells.length}>
          {shape.cells.map(function(c) {
            var attrs = {
              x: c.column * cellSize + 10,
              y: (rows - c.row - 1) * cellSize,
              width: cellSize,
              height: cellSize,
              class: shape.margin < .05 ? "minor" :
                shape.margin < .1 ? "major" : 
                "landslide"
            };
            // get neighboring cells
            var neighbors = {
              top: peek(c.row + 1, c.column),
              bottom: peek(c.row - 1, c.column),
              left: peek(c.row, c.column - 1),
              right: peek(c.row, c.column + 1)
            };
            // do those neighbors match?
            for (var k in neighbors) neighbors[k] = neighbors[k] == shape.state;
            // shrink the rectangle if it's lonely
            if (!neighbors.top) {
              attrs.y++;
              attrs.height--;
            }
            if (!neighbors.bottom) {
              attrs.height--;
            }
            if (!neighbors.left) {
              attrs.x++
              attrs.width--;
            }
            if (!neighbors.right) {
              attrs.width--;
            }
            return <rect {...attrs} />
          })}
          </g>
          <text 
            x={labelCell.column * cellSize + cellSize / 2 + 10} 
            y={(rows - labelCell.row) * cellSize - (cellSize - textSize) / 2}
            text-anchor="middle"
            fill="white"
            font-size={textSize}
          >
            {shape.state}
          </text>
        </>
      })}
      <line class="victory grid"
        x1={0} x2={svgWidth}
        y1={(rows - victoryRow) * cellSize} y2={(rows - victoryRow) * cellSize}
      />
      {/*
      <text x={0} y={(rows - victoryRow) * cellSize + textSize}>270 votes - victory</text>*/}
    </svg>
  </div>)
}

export function Leaderboard(props) {
  var { called } = props;

  return (
    <div class="leaderboard">
      <div class="results-header-group dem">
        <h2 class="party">
          <label>Biden</label>
          <abbr>{sum(called.Dem)}</abbr>
        </h2>
      </div>

      <div class="results-header-group gop">
        <h2 class="party">
          <label>Trump</label>
          <abbr>{sum(called.GOP)}</abbr>
        </h2>
      </div>

      <div class="results-header-group not-called">
        <h2 class="party">
          <label>Uncalled</label>
          <abbr>{sum(called.uncalled)}</abbr>
        </h2>
      </div>
    </div>
  );
}

export default function ElectoralGrid(props) {
  var { results } = props;

  var called = {
    Dem: [],
    GOP: [],
    uncalled: []
  }

  if (results) {
    results.forEach(r => r.called && called[r.winnerParty || "uncalled"].push(r));
  }

  var min = Math.max(270, sum(called.Dem), sum(called.GOP));
  min = Math.ceil(min / 10) * 10;

  return <div class="electoral-grid">
    <Leaderboard called={called} />

    <div class="grids-container">
      <Grid class="D" width={10} races={called.Dem} min={min}/>
      <Grid class="R" width={10} races={called.GOP} min={min}/>
    </div>
  </div>;
}