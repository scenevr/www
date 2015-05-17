var browserify = require('browserify-middleware');
var express = require('express');
var app = express();
var URI = require('uri-js');
var expressLess = require('express-less');
var favicon = require('serve-favicon');
var renderClient = require('./src/render-client');

app.use('/scenevr.js', browserify('./client.js', {
  transform: ['browserify-jade', 'stringify']
}));
app.use('/css', expressLess(__dirname + '/css'));
app.use(express.static('public'));
app.use('/screenshots', express.static('screenshots'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/favicon.ico'));

// app.get('/', function (req, res) {
//   renderClient(res, 'ws://home.scenevr.hosting/home.xml');
// });

var getWebsocketUrl = function (path) {
  var uri;

  if (path === '/') {
    uri = URI.parse('ws://home.scenevr.hosting/home.xml');
  } else {
    uri = URI.parse('ws:/' + path);
  }

  // force 8080 for websockets
  uri.port = 8080;

  if ((uri.path === '') || (uri.path === '/')) {
    uri.path = '/index.xml';
  }

  return URI.serialize(uri);
};

app.get('*', function (req, res) {
  var url = getWebsocketUrl(req.path);
  renderClient(res, url);
});

var server = app.listen(9010, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
