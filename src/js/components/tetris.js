import { h, Fragment } from "preact";

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

export default function Tetris(props) {

  var { width } = props;
  var cellSize = 20;
  var textSize = cellSize * .5;
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

  var { races } = props;
  var snake = Snake(width);
  var shapes = races.reverse().map(function(r) {
    var cells = [];
    var label = r.district ? r.district : r.state;
    for (var i = 0; i < r.electoral; i++) {
      var c = snake.next().value;
      cells.push(c);
      poke(c.row, c.column, label);
    }
    return {
      data: r,
      label,
      cells
    }
  });

  var topShape = last(shapes);
  var rows = Math.max(33, victoryRow, last(topShape.cells).row) + 1;

  var lines = [];
  for (var i = 1; i < rows; i++) {
    lines.push(i);
  }

  var svgWidth = width * cellSize;
  var svgHeight = rows * cellSize;

  return (<div class={"tetris " + props.class}>
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
              x: c.column * cellSize,
              y: (rows - c.row - 1) * cellSize,
              width: cellSize,
              height: cellSize
            };
            // get neighboring cells
            var neighbors = {
              top: peek(c.row + 1, c.column),
              bottom: peek(c.row - 1, c.column),
              left: peek(c.row, c.column - 1),
              right: peek(c.row, c.column + 1)
            };
            // do those neighbors match?
            for (var k in neighbors) neighbors[k] = neighbors[k] == shape.label;
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
            return <rect {...attrs} class={ i % 2 ? "a" : "b"} />
          })}
          </g>
          <text 
            x={labelCell.column * cellSize + cellSize / 2} 
            y={(rows - labelCell.row) * cellSize - (cellSize - textSize) / 2}
            text-anchor="middle"
            fill="white"
            font-size={textSize}
          >
            {shape.label}
          </text>
        </>
      })}
      <line class="victory grid"
        x1={0} x2={svgWidth}
        y1={(rows - victoryRow) * cellSize} y2={(rows - victoryRow) * cellSize}
      />
      <text x={0} y={(rows - victoryRow) * cellSize + textSize}>270 votes - victory</text>
    </svg>
  </div>)
}