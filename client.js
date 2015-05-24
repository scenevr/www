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

function uploadScreenshot (canvas) {
  var img;

  img = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];

  var w = window.open();
  w.document.write('Uploading to imgur.com...');

  $.ajax({
    url: 'https://api.imgur.com/3/upload.json',
    type: 'POST',
    headers: {
      Authorization: 'Client-ID 6dd7813a91510a3'
    },
    data: {
      type: 'base64',
      name: 'scenevr.jpg',
      title: 'SceneVR Screenshot',
      description: 'Made using http://www.scenevr.com/',
      image: img
    },
    dataType: 'json'
  }).success(function (data) {
    var url = 'http://imgur.com/' + data.data.id + '?tags';
    // _gaq.push(['_trackEvent', 'scenevr', 'uploadScreenshot', url]);

    $.ajax({
      url: 'http://www.scenevr.com/upload/',
      data 
    })
    w.location.href = url;
  }).error(function () {
    w.close();
    // _gaq.push(['_trackEvent', 'scenevr', 'uploadScreenshot', 'fail']);
  });
}

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

  // setTimeout(function () {
  //   uploadScreenshot(client.domElement[0]);
  // }, 5000);
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
