/*

Process text files as ArchieML
Anything that has a .txt extension in /data will be loaded

*/

var path = require("path");
var betty = require("@nprapps/betty");
var fs = require("fs").promises;

module.exports = function(grunt) {

  var archieml = async function() {
    grunt.task.requires("state");
    grunt.data.archieml = {};

    var files = grunt.file.expand("data/*.txt");

    files.forEach(async function(f) {
      var name = path.basename(f).replace(/(\.docs)?\.txt$/, "");
      var contents = grunt.file.read(f);

      var parsed = betty.parse(contents, {
        onFieldName: t => t[0].toLowerCase() + t.slice(1),
        onValue: function(v) {
          if (typeof v != "string") return v;
          if (v == "true" || v == "false") {
            return v != "false";
          }
          if (v.match(/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}:\d{2}.\d+Z$/)) {
            return moment(v, moment.ISO_8601).tz(timezone);
          }
          return v;
        }
      });
      grunt.data.archieml[name] = parsed;

      // ensure the data folder exists
      await fs.mkdir("build/data", { recursive: true });
      await fs.writeFile(`build/data/${name}.json`, JSON.stringify(parsed));
    });
  }

  grunt.registerTask("archieml", "Loads ArchieML files from data/*.txt", async function() {
    var done = this.async();

    archieml().then(done);
  });

};