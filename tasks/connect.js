/*

Sets up a connect server to work from the /build folder. May also set up a
livereload server at some point.

*/

var fs = require("fs");
var path = require("path");
var url = require("url");


module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-contrib-connect");

  var base = "./build";

  var caseSensitive = function(req, response, next) {
    var href = url.parse(req.url).pathname;
    var location = path.join(base, href);
    var filename = path.basename(href);
    if (!filename) return next();
    var dir = path.dirname(location);
    fs.readdir(dir, function(err, list) {
      if (!err && list.indexOf(filename) == -1) {
        response.statusCode = 404;
        response.end("<pre>            404 Not Found\n-this space intentionally left blank-</pre>");
      } else {
        next();
      }
    })
  };

  var redirectMissingData = function(req, response, next) {
    var href = url.parse(req.url).pathname;
    if (!href.match(/^\/?data\/.*.json$/)) return next();
    var local = path.join(base, href);
    fs.stat(local, function(err) {
      if (err) {
        // console.log("Redirecting to S3: ", href);
        response.statusCode = 302;
        response.setHeader("Location", path.join(grunt.data.json.project.url, href));
        response.end();
      } else {
        next();
      }
    })
  };

  var middleware = function(connect, options, ware) {
    ware.unshift(caseSensitive);
    ware.unshift(redirectMissingData);
    return ware;
  };
  
  grunt.config.merge({
    connect: {
      dev: {
        options: {
          hostname: "localhost",
          useAvailablePort: true,
          port: grunt.option("port") || 8000,
          livereload: grunt.option("reloadport") * 1 || 35739,
          base,
          //middleware to protect against case-insensitive file systems
          middleware
        }
      }
    }
  })

};
