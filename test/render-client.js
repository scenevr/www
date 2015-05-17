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
var res;

tape('render', function (t) {
  var url = 'ws://example.com/boop.xml?foo=bar';
  var view;

  res = {
    render: function (v) {
      view = v;
    }
  };

  renderClient(res, url, function (err, record) {
    t.ok(!err);

    t.same(view, 'connect');

    t.ok(record.summary.match(/This is the summary/));
    t.ok(!record.privateNetwork);
    t.ok(record.screenshot);
    t.ok(record.createdAt);
    t.same(record.title, 'boop.xml');
    t.ok(fs.existsSync(Path.join(__dirname, '..', 'screenshots', record.screenshot)));

    t.end();
  });
});

res = {
  render: function (v) { }
};

tape('private ip', function (t) {
  var url = 'ws://localhost/';

  renderClient(res, url, function (err, record) {
    t.ok(err);
    t.ok(err.match(/private network/));
    t.end();
  });
});
