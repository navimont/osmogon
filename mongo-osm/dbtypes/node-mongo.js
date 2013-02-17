/*
* Node object to store in MongoDb
*
* Stefan Wehner (2012)
*/

var Mongojs = require('mongodb');

var DB = require("../mongo/mongo-connect");

var BBox = require("../geometry/bbox").BBox;
var Way = require("../geometry/way").Way;

function Node(osm_id,lat,lon,version,visible) {
    this.visible = visible;
    this.lat = lat;
    this.lon = lon;
    this.osm_id = osm_id;
    this.version = version;
    this.attrs = undefined;
    this.rel = undefined;
}

exports.Node = Node;

// store reference to relations which use this node
// rel_memberships is a list of objects with id and role attributes.
Node.prototype.setRel = function(rel_memberships) {
    this.rel = rel_memberships;
    return this;
}

Node.prototype.store = function(decrDBQueue) {
    var nodedata = {$set: {v: this.version, type: 'n', tags: this.attrs, loc: [this.lon,this.lat], visible: this.visible}};
    if (this.rel) {
        nodedata["$addToSet"] = {rel: {$each: this.rel}};
    }
    var q_node = {"_id": {"osm": this.osm_id}};
    DB.getCollection('osm').update(q_node, nodedata, {upsert: true, safe: true}, function(error,data) {
        if (error) {
            throw new Error("Could not update/insert node: "+this.osm_id+" "+error);
        }
        decrDBQueue();
    })
}


