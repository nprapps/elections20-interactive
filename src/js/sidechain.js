var $ = require("./lib/qsa");

// load Sidechain and the legacy browser shim
// require("@webcomponents/custom-elements");
var Sidechain = require("@nprapps/sidechain");

// ugh CorePub
var upgrade = function(element) {
  var patch = document.createElement("side-chain");
  patch.setAttribute("src", element.dataset.sidechainSrc);
  element.parentNode.replaceChild(patch, element);
}
$("[data-sidechain-src]").forEach(upgrade);

if (!window.sidechainObserved) {
  window.sidechainObserved = true;

  var observer = new MutationObserver(function(events) {
    events.forEach(function(mutation) {
      if (mutation.type == "childList") {
        var added = Array.from(mutation.addedNodes).filter(n => n && n.dataset && n.dataset.sidechainSrc);
        added.forEach(upgrade);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}