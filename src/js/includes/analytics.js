var accountID = "UA-5828686-75";

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
  const currentUrl = new URL(window.location.href);
  var parent = currentUrl.searchParams.get("parentUrl");
  const parentUrl = parent ? new URL(parent) : null;
  const state = currentUrl.searchParams.get("state") || '';

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
  customData[DIMENSION_PARENT_URL] = parent || '';
  customData[DIMENSION_PARENT_HOSTNAME] = parentUrl && parentUrl.hostname;
  customData[DIMENSION_PARENT_INITIAL_WIDTH] = currentUrl.searchParams.get("initialWidth") || '';

  window.ga('create', accountID, 'auto');
  window.ga('set', 'location', gaLocation);
  window.ga('set', 'page', gaPath);
  window.ga('send', 'pageview', customData);
};

const trackEvent = (eventName, label, value) => {
  var eventData = {
    'hitType': 'event',
    'eventCategory': "elections20",
    'eventAction': eventName
  };

  if (label) { eventData['eventLabel'] = label; }
  if (value) { eventData['eventValue'] = value; }

  window.ga('send', eventData);
};


embedGa();
trackPageLoad();
window.ANALYTICS = { 'trackEvent': trackEvent };