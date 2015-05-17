var fs = require('fs-extra');
var Path = require('path');
var redis = require('redis');
var client = redis.createClient();
var summary = require('scene-summary');
var screenshot = require('scene-screenshot');
var crypto = require('crypto');
var URI = require('uri-js');
var ip = require('ip');
var dns = require('dns');

function urlToId (url) {
  // Todo - normalize URLs a bit?
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex');
}

function populateRecord (key, record, callback) {
  function save () {
    if (record.summary && record.screenshot) {
      client.set(key, JSON.stringify(record));

      if (callback) {
        callback(null, record);
      }
    }
  }

  var uri = URI.parse(record.url);

  if (!uri.host) {
    callback('Invalid url, no host.');
    return;
  }

  dns.resolve(uri.host, function (err, addresses) {
    if (err) {
      callback('Could not resolve host');
      return;
    }

    var address = addresses[0];

    if (!address) {
      callback('Could not get host ip address');
      return;
    }

    if (ip.isPrivate(address)) {
      callback('Cannot access private network');
      return;
    }

    summary(record.url, function (err, html) {
      if (err) {
        console.log('Unable to generate summary.\n\n' + err.toString());
        return;
      }

      record.summary = html;

      save();
    });

    screenshot(record.url, function (err, screenshot) {
      if (err) {
        console.log('Unable to generate screenshot.\n\n' + err.toString());
        return;
      }

      var filename = record.id + '.png';
      fs.copy(screenshot, Path.join(__dirname, '..', 'screenshots', filename), function (err) {
        if (err) {
          console.log('Unable to move screenshot.');
          return;
        }

        record.screenshot = filename;

        save();
      });
    });
  });
}

module.exports = function (res, url, callback) {
  var id = urlToId(url);
  var key = '/sites/' + id;

  client.get(key, function (err, reply) {
    if (err) {
      res.render('connect', { url: url });
      return;
    }

    var record;

    if (reply) {
      record = JSON.parse(reply);
    } else {
      record = {
        id: id,
        url: url,
        title: URI.parse(url).path.split('/').slice(-1)[0],
        createdAt: Date.now()
      };

      client.set(key, JSON.stringify(record));

      populateRecord(key, record, callback);
    }

    res.render('connect', {
      url: url,
      summary: record.summary,
      screenshot: record.screenshot,
      title: record.title
    });
  });
};
