var redis = require('redis');
var client = redis.createClient();

module.exports = function (key, url) {
  client.get(key, function (err, reply) {
    var record;

    if (reply) {
      record = JSON.parse(reply);
    }

    record.screenshotUrl = url;

    client.set(key, JSON.stringify(record));
  });
};
