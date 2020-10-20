import { h, Fragment } from "preact";

var SCALE = 20;

var sum = races => races.reduce((t, r) => t + r.electoral, 0);
var alloc = function(area, ratio) {
  var { width, height, vertical } = area;
  return {
    ...area, // get x and y
    width: vertical ? width : width * ratio,
    height: vertical ? height * ratio : height,
    vertical
  }
};

var split = function(area, ratio) {
  var { x, y, width, height, vertical } = area;
  var first = alloc({ ...area }, ratio);
  var second = alloc({ ...area }, 1 - ratio);
  if (area.vertical) {
    second.y += area.height * ratio;
  } else {
    second.x += area.width * ratio;
  }
  return [ first, second ];
}

function Branch(props) {
  var { races, x, y, width, height, vertical, total } = props;
  var bounds = { x, y, width, height, vertical };
  races = races.slice();

  var branches = [[], []];
  if (races.length == 2) {
    branches = [[races[0]], [races[1]]];
  } else {
    var counter = 0;
    branches[1].push(races.pop());
    for (var r of races) {
      branches[~~(counter > total / 2)].push(r);
      counter += r.electoral;
    }
  } 
  var [ first, second ] = branches;
  var ratio = sum(first) / total;
  var areas = split(bounds, ratio).map(function(rect, i) {
    return {
      rect,
      total: sum(branches[i]),
      races: branches[i]
    }
  });

  return <g>
    {areas.map(function(a) {
      console.log(a);
      if (!a.races.length) {
        return null;
      }
      if (a.races.length == 1) {
        var [ race ] = a.races;
        var [ winner, loser ] = race.candidates;
        var margin = winner.percent - loser.percent;
        return <Leaf {...a.rect} race={race} />
      }
      return <Branch {...a.rect} races={a.races} total={a.total} vertical={!vertical} />
    })}
  </g>
}

function Leaf(props) {
  var { race, x, y, width, height } = props;
  var [ winner, loser ] = race.candidates;
  var margin = winner.percent - loser.percent;
  var className = margin < .02 ? "minor" : 
    margin < .05 ? "major" :
    "landslide";
  var fontSize = 12;

  return (<>
    <rect
      x={x + 1}
      y={y + 1}
      width={width - 2}
      height={height - 2}
      class={className}
    />
    <text
      x={x + width / 2}
      y={y + height / 2 + fontSize / 2}
      font-size={fontSize}
    >{race.state}</text>
  </>);
}

export default function TreeMap(props) {
  var { 
    races, 
    width = 160, 
    height = 300, 
    max = 538,
    vertical = false
  } = props;

  races = races.slice().sort((a, b) => b.electoral - a.electoral);

  var total = sum(races);
  var ratio = total / max;
  var initialArea = {
    ...alloc({ x: 0, y: 0, width, height, vertical }, ratio),
    total,
    races
  };
  console.log(initialArea);

  return (<>
    <div class="tree">
      <svg width={width} height={height} style="border: 1px solid gray" class={props.class}>
      <Branch {...initialArea} />
      </svg>
    </div>
  </>);
}