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
var net = require('net');
var Queue = require('bull');

function crawl (key, record) {
  summary(record.url, function (err, html) {
    if (err) {
      console.log('Unable to generate summary');
      return;
    }

    record.summary = html;

    client.set(key, JSON.stringify(record));
  });
}

function urlToId (url) {
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex');
}

function populateRecord (key, record, callback) {
  function testIpAddress (address) {
    if (ip.isPrivate(address)) {
      callback('Cannot access private network');
      return;
    }

    crawl(key, record);

    callback(null, record);
  }

  var uri = URI.parse(record.url);

  if (!uri.host) {
    callback('Invalid url, no host.');
    return;
  }

  if (net.isIP(uri.host)) {
    testIpAddress(uri.host);
  } else {
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

      testIpAddress(address);
    });
  }
}

module.exports = function (res, url, callback) {
  var id = urlToId(url);
  var key = '/sites/' + id;

  if (!callback) {
    callback = function (err) {
      if (err) {
        console.log(err);
      }
    };
  }

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
