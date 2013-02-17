/**
* Interface for reading OSM data from Mongo
*
* Stefan Wehner 2012
*/

var Db = require('./db/mongo-dao');
var Settings = require('../settings').getSettings();


exports.MongoOsm = MongoOsm;

function MongoOsm(mongo_host, mongo_port) {
    mongo_host = mongo_host || Settings.MONGO_HOST;
    mongo_port = mongo_port || Settings.MONGO_PORT;
    this.osm = Db.connect(mongo_host, mongo_port);
}

/*
* Callback function signature for all calls below: function(error, result)
* 'error' is either null or contains an error string
* 'result' is an object with attributes:
*
* result = {
*    nodes: []       // array of geometry/node objects
*    ways: []        // array of geometry/way objects
*    relations: []   // array of geometry/relation objects
* }
*
*/

/*
* Search database for nodes, ways and relations with the given tag(s).
* 'tags' is a query object for OSM tags.
*
* Examples: tags = {highway: "motorway"}
*           tags = {natural: {$in: ["wood", "scrub"]}}
*
* WARNING: Maybe slow, depending on the tag which is used. Common
*          tags (like: highway, name, natural) are indexed. See
*          ensureIndex calls in mongo/mongo-connection.js for a
*          complete list.
*/
MongoOsm.prototype.findOsm = function(tags, callback) {
    this.osm.findOsm(tags, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* near a given location(s).
*
* 'loc' is a point [lon,lat] or an array of points [[lon,lat],...]
* 'distance' is in kilometers.
*/
MongoOsm.prototype.findOsmNear = function(loc, distance, tags, callback) {
    this.osm.findOsmNear(loc, distance, tags, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* inside a given bounding box.
*
* 'bbox' is a bounding box object (import geometry/bbox)
* Example: var bbox = new BBox([[34.89,71.66],[35.11,72.02]]);
*
* WARNING: This will be slow for a large bounding box!
*/
MongoOsm.prototype.findOsmBox = function(bbox, tags, callback) {
    this.osm.findOsmBox(bbox, tags, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* inside a given polygon.
*
* 'polygon' is an array of coordinates [[lon,lat],...]
*
* WARNING: This will be slow for a large polygon!
*/
MongoOsm.prototype.findOsmPolygon = function(polygon, tags, callback) {
    this.osm.findOsmPolygon(polygon, tags, callback);
}

