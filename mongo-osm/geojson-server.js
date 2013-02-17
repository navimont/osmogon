
/*
 * serves OSM data from Mongo database
 * Date is returend in GeoJson format.
 *
 * Stefan Wehner 2013
 */
var MongoOsm = require('./mongo-osm').MongoOsm;
var GeoJsonStream = require('./writer/geojson.js').GeoJsonStream;
var BBox = require('./geometry/bbox').BBox;
var Logger = require('../util/logger');

var osm = new MongoOsm();

exports.server = function(req, res) {
  Logger.debug("Bounding box request", {querystring: req.query})
  var bbox = new BBox([[parseFloat(req.query.minlon),parseFloat(req.query.minlat)],[parseFloat(req.query.maxlon),parseFloat(req.query.maxlat)]]);
  if (!bbox.isDefined()) {
      res.send(500, {error: "Not a valid bounding box (define minlon,minlat,maxlon,maxlat in query string)"});
      return;
  }
  osm.findOsmBox(bbox, JSON.parse(req.query.query), function(error, result) {
      if (error) {
          res.send(500, {error: error});
          return;
      }
      var jsondata;
      var json_stream = new GeoJsonStream(result);
      // streamer calls the data method once with the full gjson object
      json_stream.on("data", function(data) {
          jsondata=data;
      })
      json_stream.on("end", function() {
          res.json(jsondata);
      })
  })
};
