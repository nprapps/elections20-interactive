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

  var { races } = props;
  var snake = Snake(width);
  var shapes = races.reverse().map(function(r) {
    var cells = [];
    for (var i = 0; i < r.electoral; i++) {
      cells.push(snake.next().value);
    }
    return {
      label: r.state,
      cells
    }
  });

  var last = a => a[a.length - 1];
  var middle = a => a[a.length >> 1];
  var topShape = last(shapes);
  var rows = Math.max(30, last(topShape.cells).row);

  var makePath = function(cells) {
    return cells.map((c, i) => (i ? "L" : "M") + [
      c.column * cellSize + cellSize / 2,
      (rows - c.row) * cellSize + cellSize / 2
    ].join()).join(" ");
  }

  return <svg class={"tetris " + props.class} width={width * cellSize} height={rows * cellSize}>
    {shapes.map(function(shape, i) {
      var center = middle(shape.cells);
      return <>
        <g data-state={shape.label} data-count={shape.cells.length}>
        {shape.cells.map(c => <rect
          width={cellSize}
          height={cellSize}
          x={c.column * cellSize}
          y={(rows - c.row - 1) * cellSize}
          fill={i % 2 ? "#888" : "#555"}
          class={i % 2 ? "a" : "b"}
        />)}
        </g>
        <text 
          x={center.column * cellSize + cellSize / 2} 
          y={(rows - center.row) * cellSize - 2}
          text-anchor="middle"
          fill="white"
          font-size={cellSize - 3}
        >
          {shape.label}
        </text>
      </>
    })}
  </svg>
}