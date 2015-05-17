var $ = require('jquery');
var Client = require('scene-client');
var URI = require('uri-js');

var getUrlFromLocation = function () {
  var path = window.location.pathname + window.location.search;
  var uri;

  if (path === '/') {
    uri = URI.parse('ws://home.scenevr.hosting/home.xml');
  } else {
    uri = URI.parse('ws:/' + path);
  }

  // force 8080 for websockets to get around proxies that dont upgrade websocket requests
  if ((!uri.port) || (uri.port === 80)) {
    uri.port = 8080;
  }

  if ((uri.path === '') || (uri.path === '/')) {
    uri.path = '/index.xml';
  }

  return URI.serialize(uri);
};

var client;

$(function () {
  client = new Client(document.getElementById('scene-view'));
  client.initialize();

  window.client = client;

  client.loadScene(getUrlFromLocation());

  client.on('enterportal', function (e) {
    var path = e.url.replace(/^.+\/\//, '');

    window.history.pushState({ url: path }, 'SceneVR', '/' + path);
  });
});

$(window).on('popstate', function () {
  var url = getUrlFromLocation();

  console.log('pop state');

  if (!client.isConnected()) {
    return;
  } else if (client.getSceneUrl() === url) {
    return;
  } else {
    console.log('Changing url...');

    client.loadScene(url);
  }
});
