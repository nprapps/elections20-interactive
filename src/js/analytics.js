var DataConsent = require('./lib/data-consent');

var setupGoogle = function() {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  
  // embedded analytics
  if (window.top !== window) {
    ga("create", "UA-5828686-75", "auto");
    // By default Google tracks the query string, but we want to ignore it.
    var here = new URL(window.location);
  
    ga("set", "location", here.protocol + "//" + here.hostname + here.pathname);
    ga("set", "page", here.pathname);
  
    // Custom dimensions & metrics
    var parentUrl = here.searchParams.has("parentUrl") ? new URL(here.searchParams.get("parentUrl")) : "";
    var parentHostname = "";
  
    if (parentUrl) {
        parentHostname = parentUrl.hostname;
    }
  
    var initialWidth = here.searchParams.get("initialWidth") || "";
  
    ga("set", {
      dimension1: parentUrl,
      dimension2: parentHostname,
      dimension3: initialWidth
    });
    ga("send", "pageview");
  } else {
    // standalone page analytics
    ga("create", "UA-5828686-4", "auto");
    ga("set", {
      dimension22: document.title
    });
    // do not send pageview because we'll handle that virtually
  }
}

if (DataConsent.hasConsentedTo(DataConsent.PERFORMANCE_AND_ANALYTICS)) {
  setupGoogle();
}