var aws = require("aws-sdk");
var async = require("async");

module.exports = function(grunt) {

  grunt.registerTask("votecast", function() {

    var done = this.async();

    var arn = grunt.option("arn");
    var bucket = grunt.option("bucket");
    var session = grunt.option("session") || "votecast";
    if (!arn || !bucket) {
      grunt.fail.fatal("Please provide an ARN and a bucket to pull from");
    }

    var creds = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION || "us-east-1"
    };
    aws.config.update(creds);

    var sts = new aws.STS();

    async.waterfall([function(next) {
      sts.assumeRole({
        RoleArn: arn,
        RoleSessionName: session
      }, next);
    }, function(data, next) {
      var s3 = new aws.S3({
        accessKeyId: data.Credentials.AccessKeyId,
        secretAccessKey: data.Credentials.SecretAccessKey,
        sessionToken: data.Credentials.SessionToken
      });

      s3.listObjectsV2({
        Bucket: bucket
      }, function(err, data) {
        grunt.log.writeln(`Retrieved ${data.Contents.length} keys from bucket listing...`);
        next(err, s3, data);
      });
    }, function(s3, data, next) {
      async.forEach(data.Contents, function(item, c) {
        s3.getObject({
          Bucket: bucket,
          Key: item.Key
        }, function(err, data) {
          grunt.log.writeln(`Writing file: temp/votecast/${item.Key}...`)
          grunt.file.write(`temp/votecast/${item.Key}`, data.Body);
          c();
        });
      }, done)
    }])


  });

}