// Babel 7's `"useBuiltIns: "usage"` will automatically insert polyfills
// https://babeljs.io/docs/en/next/babel-preset-env#usebuiltins

import './includes/analytics.js';
import { BigBoardCore } from './includes/big-board-core.js';

import $ from './lib/qsa.js';
import { h, render } from 'preact';

var bbc = $.one('.big-board');

render(<BigBoardCore json="ballot-measures-national.json" title="Key Ballot Initiatives"/>, bbc)


