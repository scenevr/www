var proxyquire = require('proxyquire').noCallThru();
var fs = require('fs');
var Path = require('path');

proxyquire('../src/render-client', {
  redis: require('fakeredis'),
  'scene-summary': function (url, callback) {
    callback(null, 'This is the summary');
  },
  'scene-screenshot': function (url, callback) {
    callback(null, Path.join(__dirname, 'nebelwerfer.jpg'));
  }
});

var tape = require('tape');
var renderClient = require('../src/render-client');
var res = {
  render: function (v) { }
};
var queue = renderClient.queue;

tape('render', function (t) {
  var url = 'ws://example.com/boop.xml?foo=bar';

  renderClient(res, url, function (err, record) {
    t.ok(!err);

    queue.on('completed', function (job) {
      record = job.data.record;

      t.ok(record.summary.match(/This is the summary/));
      t.ok(!record.privateNetwork);
      t.ok(record.screenshot);
      t.ok(record.createdAt);
      t.same(record.title, 'boop.xml');
      t.ok(fs.existsSync(Path.join(__dirname, '..', 'screenshots', record.screenshot)));

      t.end();
    });
  });
});

tape('private ip', function (t) {
  var url = 'ws://localhost/';

  renderClient(res, url, function (err, record) {
    t.ok(err);
    t.ok(err.match(/private network/));
    t.end();
  });
});

tape('bad domain name', function (t) {
  var url = 'ws://flammenwerfer/';

  renderClient(res, url, function (err, record) {
    t.ok(err);
    t.same(err, 'Could not resolve host');
    t.end();
  });
});

tape('host by ip address', function (t) {
  var url = 'ws://127.0.0.1/';

  renderClient(res, url, function (err, record) {
    t.ok(err);
    t.ok(err.match(/private network/));
    t.end();
  });
});

tape('shutdown', function (t) {
  queue.close();
  t.end();
});
