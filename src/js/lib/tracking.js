//module for interfacing with GA

/**
@param [category] - usually "interaction"
@param action - what happened
@param [label] - not usually visible in dashboard, defaults to title or URL
*/

var isEmbedded = require("./embedded");
var DataConsent = require('./data-consent');

var DIMENSION_PARENT_URL = 'dimension1';
var DIMENSION_PARENT_HOSTNAME = 'dimension2';
var DIMENSION_PARENT_INITIAL_WIDTH = 'dimension3';

var a = document.createElement("a");

var slug = window.location.pathname.replace(/^\/|\/$/g, "");

var track = function(eventAction, eventLabel, eventValue) {
  // Bail early if opted out of Performance and Analytics consent groups
  if (!DataConsent.hasConsentedTo(DataConsent.PERFORMANCE_AND_ANALYTICS)) return;

  var event = {
    eventAction,
    eventLabel,
    eventValue,
    hitType: "event",
    eventCategory: "apps-" + slug
  }


  // hack canonical link tags
  var canonicalurl = String(window.location.href);
  var canonicalurl = canonicalurl.replace("index.html", "");
  canonicalurl = canonicalurl.replace("apps.npr.org.s3.amazonaws.com", "apps.npr.org");
  // localhost shouldn't ever appear in what google is indexing, but...
  canonicalurl = canonicalurl.replace("localhost:8000/", "apps.npr.org/elections20-interactive/");

  canonicalurl = canonicalurl.split("?")[0];


  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    console.log("canonical exists, changing link to " + canonicalurl);
    canonical.href = canonicalurl;
  } else {
    console.log("No canonical exists, setting link to " + canonicalurl);
    const linkTag = document.createElement('link');
    linkTag.setAttribute('rel', 'canonical');
    linkTag.href=canonicalurl;
    document.head.appendChild(linkTag);
  };


  console.log(`Tracking: ${eventAction} / ${eventLabel} / ${eventValue}`)

  var search = window.location.search.replace(/^\?/, "");
  var query = {};
  search.split("&").forEach(pair => {
    var [key, value] = pair.split("=");
    query[key] = value;
  });
  var parentURL = query.parentUrl;
  a.href = parentURL;
  var hostname = a.hostname;

  event[DIMENSION_PARENT_URL] = parentURL;
  event[DIMENSION_PARENT_HOSTNAME] = hostname;

  if (window.ga) ga("send", event);
};

track.page = function(url) {
  // don't send these when embedded
  if (isEmbedded) return;
  
  // Bail early if opted out of Performance and Analytics consent groups
  if (!DataConsent.hasConsentedTo(DataConsent.PERFORMANCE_AND_ANALYTICS)) return;

  var page = new URL(url, window.location.href);
  page = page.toString();
  console.log(`Virtual pageview: ${page}`);
  if (window.ga) {
    ga("set", "page", page);
    ga("send", "pageview");
  }
}

module.exports = track;
