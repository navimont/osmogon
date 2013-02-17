/**
* Create singleton instance per osm database.
*
* Stefan Wehner 2012
*/

var Mongojs = require('mongodb');

var MongoFactory = require('./mongo-factory');
var Logger = require('../../util/logger');
var Settings = require('../../settings').getSettings();
var OsmConverter = require('../converter/osm-converter');

var OsmDb = {};

var EarthRadius = 6378 // km

/**
 * Give access to a dao instance for the given host and port
 */
exports.MongoDao = function(mongo_host, mongo_port) {
    if (!OsmDb.hasOwnProperty(mongo_host+mongo_port)) {
        OsmDb[mongo_host+mongo_port] = new MongoDao(mongo_host, mongo_port);
    }
    return OsmDb[mongo_host+mongo_port];
}

exports.TestInterface = {
    injectMongoDb: function(mock) {MongoFactory = mock;},
    injectLogger: function(mock) {Logger = mock;},
    injectOsmConverter: function(mock) {OsmConverter = mock;},
    tagsPrefix: tagsPrefix
}

function MongoDao(mongo_host, mongo_port) {
    this.host = mongo_host;
    this.port = mongo_port;
    this.collection = undefined;
    this.queued = [];
    var context = this;

    function connectedCb(error) {
        if (error) {
            throw new Error("Could not connect to Mongo: "+error);
        }
        context.collection = MongoFactory.getCollection(Settings.OSM_COLLECTION);
        context.callEnqueued(context.collection);
    }

    MongoFactory.connect(mongo_host, mongo_port, connectedCb);
}

MongoDao.prototype.findOsm = function(tags, callback) {
    Logger.debug("MongoDao.findOsm", tags);
    var query = tagsPrefix(tags);
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

MongoDao.prototype.findOsmNear = function(loc, distance_km, tags, callback) {
    Logger.debug("MongoDao.findOsmNear loc="+loc+" distance="+distance_km+"km", tags);

    function osmGeoNear(collection, query, callback) {
        var options = {
            query: query,
            spherical: true,
            maxDistance: distance_km / EarthRadius,
            uniqueDocs: true
        }
        Logger.info("geoNear options: ", options);
        collection.geoNear(loc[0], loc[1], options, function(error, result) {
            if (error) {
                callback("Failed to execute query <"+query+"> Error: "+error);
                return;
            }
            Logger.trace("geoNear returns: ", result);
            var osm = [];
            result.results.forEach(function(res) {
                osm.push(res.obj);
            });
            OsmConverter.convertToOsm(collection, osm, callback);
        });
    }

    var context = this;
    this.callWhenReady( function(collection) {osmGeoNear(context.collection, tagsPrefix(tags), callback)} );
}

MongoDao.prototype.findOsmBox = function(bbox, tags, callback) {
    Logger.debug("MongoDao.findOsmBox bbox="+bbox, tags);
    var query = tagsPrefix(tags);
    query.loc = {$within: {$box: bbox.bbox()}};
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

MongoDao.prototype.findOsmPolygon = function(polygon, tags, callback) {
    Logger.debug("MongoDao.findOsmPolygon polygon=", {polygon: polygon, tags: tags});
    var query = tagsPrefix(tags);
    query.loc = {$within: {$polygon: polygon}};
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

// queue up Db calls in case DB connection is not established
MongoDao.prototype.callWhenReady = function(dbfind) {
    this.queued.push( dbfind );
    if (this.collection) {
        this.callEnqueued();
    }
}

// call enqueued DB requests
MongoDao.prototype.callEnqueued = function() {
    while (this.queued.length) {
        this.queued.pop()(this.collection);
    }
}


function find(collection, query, callback) {
    Logger.info("Executing query: ", query);
    collection.find(query).toArray(function(error, result) {
        if (error) {
            callback("Failed to execute query <"+query+"> Error: "+error);
            return;
        }
        OsmConverter.convertToOsm(collection, result, callback);
    });
}


// prefix property names with 'tags.' as so they are named in the DB
function tagsPrefix(user_query) {
    var query = {};
    for (var tag in user_query) {
        if (tag.slice(0,1) != '$') {
            query["tags."+tag] = user_query[tag];
        } else {
            query[tag] =  user_query[tag];
        }
    };
    return query;
}
