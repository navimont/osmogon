
/**
 * Module dependencies.
 */

var express = require('express');
var osmongo = require('./mongo-osm/geojson-server').server;
var map = require('./routes/map').map;

var app = express();

// Configuration

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// serve osm data requests
app.get('/osm', osmongo);
// serve map editor page
app.get('/', map);


app.listen(app.get('port'));
console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
