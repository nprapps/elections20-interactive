// Babel 7's `"useBuiltIns: "usage"` will automatically insert polyfills
// https://babeljs.io/docs/en/next/babel-preset-env#usebuiltins

import './includes/analytics.js';
import { GetCaughtUp } from './includes/get-caught-up.js';

import $ from './lib/qsa.js';
import { h, render } from 'preact';

var gcu = $.one('.get-caught-up-wrapper');

render(<GetCaughtUp/>, gcu)

