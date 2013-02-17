/**
* Convert OSM data from Mongo DB to proper node.
*
* Stefan Wehner (2012)
*/

var Node = require('../geometry/node').Node;


exports.NodeConverter = NodeConverter;

function NodeConverter(collection, osm, callback) {
    this.collection = collection;
    this.osm = osm;
    this.node = new Node(osm._id.osm, osm.loc, osm.visible, osm.tags);
    // if node is part of a relation set memberships here
    if (osm.rel) {
        this.node.rel = osm.rel;
    }
    var context = this;

    process.nextTick(function() {callback(null, context.node)});
}

