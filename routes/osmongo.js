
/*
 * serves OSM data from Mongo database
 * Date is returend in GeoJson format.
 *
 * Stefan Wehner 2013
 */
var OsmMongo = require('../lib/osm-mongo').OsmMongo;
var GeoJsonStream = require('../lib/writer/geojson.js').GeoJsonStream;
var BBox = require('../lib/geometry/bbox').BBox;
var Logger = require('../lib/util/logger');

var osm = new OsmMongo();

exports.osmongo = function(req, res) {
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
