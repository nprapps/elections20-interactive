import appConfig from './app_config.js';
import URL from 'url-parse';

const embedGa = () => {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    };
    i[r].l = 1 * new Date();
    a = s.createElement(o);
    m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
};

const trackPageLoad = () => {
  const currentUrl = new URL(window.location.href, true);
  console.log(currentUrl.query);
  const parentUrl = new URL(currentUrl.query.parentUrl);
  const state = currentUrl.query.state || '';

  const embedUrl = window.location.protocol +
    '//' + window.location.hostname +
    window.location.pathname;

  const gaLocation = state ? `${embedUrl}?state=${state}` : embedUrl;
  const gaPath = state ? `${window.location.pathname}?state=${state}` : window.location.pathname;

  // Dimension structure mirrrors that of the standard Visuals team analytics
  const DIMENSION_PARENT_URL = 'dimension1';
  const DIMENSION_PARENT_HOSTNAME = 'dimension2';
  const DIMENSION_PARENT_INITIAL_WIDTH = 'dimension3';
  let customData = {};
  customData[DIMENSION_PARENT_URL] = currentUrl.query.parentUrl || '';
  customData[DIMENSION_PARENT_HOSTNAME] = parentUrl.hostname;
  customData[DIMENSION_PARENT_INITIAL_WIDTH] = currentUrl.query.initialWidth || '';

  window.ga('create', appConfig.VIZ_GOOGLE_ANALYTICS.ACCOUNT_ID, 'auto');
  window.ga('set', 'location', gaLocation);
  window.ga('set', 'page', gaPath);
  window.ga('send', 'pageview', customData);
};

const trackEvent = (eventName, label, value) => {
  var eventData = {
    'hitType': 'event',
    'eventCategory': appConfig.PROJECT_SLUG,
    'eventAction': eventName
  };

  if (label) { eventData['eventLabel'] = label; }
  if (value) { eventData['eventValue'] = value; }

  window.ga('send', eventData);
};

const trackCompletion = () => {
  // Register a "completion" event when a user scrolls to or past
  // the bottom of an embed's iframe
  let wasIframeBottomVisibleOrPassed = false;
  window.pymChild.onMessage('viewport-iframe-position', parentInfo => {
    const parentWindowHeight = Number(parentInfo.split(' ')[1]);
    const iframeBottom = Number(parentInfo.split(' ')[4]);
    const isIframeBottomVisibleOrPassed = (parentWindowHeight > iframeBottom);
    if (
      // No need to run computation if the event already happened
      !wasIframeBottomVisibleOrPassed &&
      isIframeBottomVisibleOrPassed
    ) {
      wasIframeBottomVisibleOrPassed = true;
      window.ANALYTICS.trackEvent('finished-graphic', document.title);
    }
  });
};

embedGa();
trackPageLoad();
window.ANALYTICS = { 'trackEvent': trackEvent };
window.addEventListener('load', () => {
  // Queue this listener until Pym is ready
  setTimeout(trackCompletion, 0);
});
