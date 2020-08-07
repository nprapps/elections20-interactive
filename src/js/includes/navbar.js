import {
  isLocalhost,
  isNPRHost,
  identifyParentHostname,
  shouldUsePJAXForHost
} from './helpers.js';

const updateMenuParent = function (e) {
  // Update iframe
  if (window.pymChild) {
    setTimeout(window.pymChild.sendHeight, 0);
  }
};

const followNavLink = function (e) {
  // Make sure links open in `_top`
  const domain = identifyParentHostname();
  if (
    e.target.tagName === 'A' &&
    e.target !== e.currentTarget &&
    window.pymChild &&
    shouldUsePJAXForHost(domain)
  ) {
    window.pymChild.sendMessage('pjax-navigate', e.target.href);
    e.preventDefault();
    e.stopPropagation();
  }
};

const setNavBarHandlers = () => {
  // Show navigation drop-down on mobile widths
  var resultsMenuButton = document.querySelector('.small-screen-nav-label');
  resultsMenuButton.addEventListener('click', updateMenuParent);

  // Show state-list drop-down, on both desktop and mobile
  var stateMenuButton = document.querySelector('.state-nav-label');
  stateMenuButton.addEventListener('click', updateMenuParent);

  // Follow navigation clicks
  var resultsMenu = document.querySelector('.menu');
  resultsMenu.addEventListener('click', followNavLink);
  var stateMenu = document.querySelector('.state-nav');
  stateMenu.addEventListener('click', followNavLink);
};

const showNavbarIfNotStationEmbed = () => {
  // Want to disable navigation on all embeds on member-station sites
  // Would make more sense to hide-if-member-station, but because of JS
  // load order and HTML rendering order, that would cause the navbar
  // to show briefly, then disappear
  const domain = identifyParentHostname();
  if (!domain || isNPRHost(domain) || isLocalhost(domain)) {
    const navbarWrapper = document.getElementById('results-nav-wrapper');
    navbarWrapper.classList.remove('hidden');
  }
};

const showFooterIfNotOnNPR = () => {
  // The footer is only necessary if the user is _not_ on NPR.org
  // Otherwise, the footer is redundant with the main NPR footer
  const domain = identifyParentHostname();
  if (!domain || !isNPRHost(domain)) {
    const footer = document.getElementById('npr-elections-footer');
    // Some pages don't have the footer included
    if (footer) { footer.classList.remove('hidden'); }
  }
};

// Set the handlers when this ES6 module is imported for its side-effects
const onLoad = () => {
  // Need to wait briefly, until `window.pymChild` can be instantiated elsewhere
  setTimeout(() => {
    showNavbarIfNotStationEmbed();
    showFooterIfNotOnNPR();
    setNavBarHandlers();
  }, 1);
};
// Handle the case where this module is imported _after_ the page loads,
// as with the special liveblog embed
if (document.readyState === 'complete') {
  onLoad();
} else {
  window.addEventListener('load', onLoad);
}
