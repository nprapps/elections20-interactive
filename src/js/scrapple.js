/*

A simple HTML hashbang router with basic param support

*/

var Scrapple = function() {
  this.routes = [];
  window.addEventListener("hashchange", this.onHashUpdate.bind(this));
  //update after routes have a chance to be registered
  requestAnimationFrame(() => this.onHashUpdate());
};

Scrapple.prototype = {
  onHashUpdate() {
    try {
      var url = this.normalizePath(window.location.hash);
      for (var i = 0; i < this.routes.length; i++) {
        var route = this.routes[i];
        if (route.re.test(url)) {
          var params = route.parse(url);
          var event = { url, params };
          this.onhit(event);
          route.callback(event);
          return;
        }
      }
      this.onmiss(url);
    } catch (err) {
      console.error(err);
    }
  },
  // catch-all event handlers
  onmiss(url) { console.log(`No matching route found for "${url}"`) },
  onhit(e) { console.log(e) },
  // paths may include parameters, such as /constant/:param/constant
  add(p, callback) {
    var paths = typeof p == "string" ? [p] : p;
    paths.forEach(path => {
      var segments = this.normalizePath(path).split("/");
      var names = [];
      var converted = segments.map(function(segment) {
        if (segment[0] == ":") {
          names.push(segment.slice(1).replace(/\?$/, ""));
          return `([^/]+)`;
        }
        return segment;
      });
      var source = converted.join("/");
      var re = new RegExp("^/?" + source + "/?$");
      var parse = function(path) {
        var match = re.exec(path);
        var params = {};
        names.forEach(function(n, i) {
          params[n] = match[i + 1];
        });
        return params;
      }
      var route = { re, parse, callback }
      this.routes.push(route);
    });
  },
  //removes trailing slashes, opening slashes, and hashbangs
  normalizePath(p) {
    return p.replace(/^\/|^#!?\/?|\/$/g, "");
  }
}

export default Scrapple;