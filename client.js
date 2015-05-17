var $ = require('jquery');
var Client = require('scene-client');

var getUrlFromLocation = function () {
  if (window.location.pathname === '/') {
    return 'ws://home.scenevr.hosting/home.xml';
  } else {
    return 'ws:/' + window.location.pathname + window.location.search;
  }
};

var client;

$(function () {
  client = new Client(document.getElementById('scene-view'));
  client.initialize();

  window.client = client;

  console.log(getUrlFromLocation());

  client.loadScene(getUrlFromLocation());

  client.on('enterportal', function (e) {
    window.history.pushState({}, 'SceneVR', '/' + e.url.replace(/^.+\/\//, ''));
  });
});

$(window).on('popstate', function () {
  var url = getUrlFromLocation();

  if (!client.isConnected()) {
    return;
  } else if (client.getSceneUrl() === url) {
    return;
  } else {
    client.loadScene(url);
  }
});
