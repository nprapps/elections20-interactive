
/*
 * Basic Javascript helpers used in analytics.js and graphics code.
 */

/*
 * Convert arbitrary strings to valid css classes.
 * via: https://gist.github.com/mathewbyrne/1280286
 *
 * NOTE: This implementation must be consistent with the Python classify
 * function defined in base_filters.py.
 */
const classify = function (str) {
  return str.toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/*
 * Parse a url parameter by name.
 * via: http://stackoverflow.com/a/901144
 */

function isLocalhost(hostname) {
  return hostname && ['127.0.0.1', 'localhost', '0.0.0.0'].includes(hostname);
}

function shouldUsePJAXForHost(hostname) {
  // Do not include `apps.npr.org`, since this is our test page,
  // and it doesn't act like a normal NPR.org page (with PJAX)
  return isNPRHost(hostname) && hostname !== 'apps.npr.org';
}

function isNPRHost(hostname) {
  return hostname &&
    (hostname === 'npr.org' || hostname.endsWith('.npr.org'));
}

const identifyParentHostname = function () {
  return window.pymChild
    ? new URL(window.pymChild.parentUrl).hostname
    : window.location.hostname;
};

const buildDataURL = function (filename) {
  if (isLocalhost(document.location.hostname)) {
    return './assets/data/' + filename
  } else {
    return './assets/data/' + filename;
  }
};

const getHighestPymEmbed = window => {
  // For when there may be Pym iframes inside Pym iframes, recursively
  // determine which the highest-level Pym child is (ie,
  // which embed is the child of the overall parent `window`)

  // `iframe`s can only look at `window.parent` if it is of the same host
  const windowAndParentWindowAreSameDomain = window.pymChild &&
    new URL(window.pymChild.parentUrl).hostname === document.location.hostname;

  if (!window.pymChild) {
    return null;
  } else if (
    window.pymChild &&
    (!windowAndParentWindowAreSameDomain || !window.parent.pymChild)
  ) {
    return window.pymChild;
  } else {
    return window.parent.pymChild;
  }
};

// Credit Sonya Moisset
// https://medium.freecodecamp.org/three-ways-to-title-case-a-sentence-in-javascript-676a9175eb27
const toTitleCase = str =>
  str.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase().concat(word.slice(1)))
    .join(' ');

export {
  classify,
  isLocalhost,
  isNPRHost,
  shouldUsePJAXForHost,
  identifyParentHostname,
  buildDataURL,
  getHighestPymEmbed,
  toTitleCase
};
