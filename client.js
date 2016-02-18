var Client = require('scene-client');
var URI = require('uri-js');

var getUrlFromLocation = function () {
  var path = window.location.pathname + window.location.search;
  var uri;

  if (path === '/') {
    uri = URI.parse('wss://grid.scenevr.com/scenes/41');
  } else {
    var scheme = path.split('/')[1];
    var restOfPath = path.replace(/.+?\//, '');
    uri = URI.parse(scheme + '://' + restOfPath);
  }

  // force 8080 for websockets to get around proxies that dont upgrade websocket requests
  if ((uri.scheme === 'ws') && ((!uri.port) || (uri.port === 80))) {
    uri.port = 8080;
  }

  if ((uri.path === '') || (uri.path === '/')) {
    uri.path = '/index.xml';
  }

  return URI.serialize(uri);
};

var client;

window.startClient = function () {
  client = new Client(document.getElementById('scene-view'));
  client.initialize();

  window.client = client;

  client.loadScene(getUrlFromLocation());

  client.on('enterportal', function (e) {
    var scheme = e.url.replace(/:\/.+/, '');
    var path = e.url.replace(/^.+\/\//, '');

    window.history.pushState({ url: path }, 'SceneVR', '/' + scheme + '/' + path);
  });
};

window.addEventListener('popstate', () => {
  var url = getUrlFromLocation();

  if (!client.isConnected()) {
    return;
  } else if (client.getSceneUrl() === url) {
    return;
  } else {
    client.loadScene(url);
  }
});
