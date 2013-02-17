/*
* Stream writer for GeoJson data
*
* Stefan Wehner (2012)
*/

var Util = require("util");
var Stream = require("stream");

var Logger = require("../util/logger");
var Geomath = require("../geometry/geomath");

exports.TestInterface = {
    injectLogger: function(mock) {Logger = mock}
}

function GeoJsonFeature(osm_id, tags) {
    this.feature = {"type": "Feature",
                    "id": osm_id,
                    "properties": tags
                    };
}

GeoJsonFeature.prototype.convert = function() {
    return this.feature;
}

function GeoJsonPoint(osm_id, tags, coords) {
    GeoJsonPoint.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "Point",
                             "coordinates": coords };
}

Util.inherits(GeoJsonPoint, GeoJsonFeature);

function GeoJsonMultiPoint(osm_id, tags, coords) {
    GeoJsonMultiPoint.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "MultiPoint",
                             "coordinates": coords };
}

Util.inherits(GeoJsonMultiPoint, GeoJsonFeature);

function GeoJsonLine(osm_id, tags, coords) {
    GeoJsonLine.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "LineString",
                          "coordinates": coords
                          };
    return this;
}

Util.inherits(GeoJsonLine, GeoJsonFeature);

function GeoJsonPolygon(osm_id, tags, coords) {
    GeoJsonPolygon.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "Polygon",
                          "coordinates": [coords]
                          };
}

Util.inherits(GeoJsonPolygon, GeoJsonFeature);

function GeoJsonMultiPolygon(osm_id, tags, coords) {
    GeoJsonMultiPolygon.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "MultiPolygon",
                          "coordinates": [coords]
                          };
}

Util.inherits(GeoJsonMultiPolygon, GeoJsonFeature);

function GeoJsonMultiLineString(osm_id, tags, coords) {
    GeoJsonLineStringPolygon.super_.call(this, osm_id, tags);
    this.feature.geometry = {"type": "MultiLineString",
                          "coordinates": coords
                          };
}

Util.inherits(GeoJsonMultiLineString, GeoJsonFeature);

// osm is a OsmMongo result object containing the attributes
// nodes     - a list of node objects
// ways      - a list of way objects
// relations - a list of relation objects
function GeoJsonStream(osm) {
    var res = {"type": "FeatureCollection",
                "features": []
              };

    osm.nodes.forEach(function(node) {
        res.features.push(new GeoJsonPoint(node.osm_id, node.attrs, node.loc).convert());
    })
    osm.ways.forEach(function(way) {
        if (way.isPolygon) {
            res.features.push(new GeoJsonPolygon(way.osm_id, way.attrs, way.coordinates).convert());
        } else {
            res.features.push(new GeoJsonLine(way.osm_id, way.attrs, way.coordinates).convert());
        }
    })
    osm.relations.forEach(function(relation) {
        // MultiPoints
        var node_coords = [];
        if (relation.nodes.length) {
            relation.nodes.forEach(function(node) {
                node_coords.push(node.loc);
            })
        }
        if (node_coords.length) {
            res.features.push(new GeoJsonMultiPoint(relation.osm_id, relation.attrs, node_coords).convert());
        }
        // Convert outer and inner (polygons) as MultiPolygon
        if (relation.ways["outer"].length || relation.ways["inner"].length) {
            var polys = [];
            relation.ways["outer"].forEach(function(outer) {
                if (outer.isPolygon()) {
                    polys.push([outer.coordinates]);
                } else {
                    Logger.warning("Relation "+relation.osm_id+" holds unconnected outer way.");
                }
            })
            relation.ways["inner"].forEach(function(inner) {
                if (inner.isPolygon()) {
                    // find corresponding outer polygon
                    var i;
                    for (i=0; i < polys.length; i++) {
                        var outer = polys[i][0];  // in geojson element 0 is the outer polygon
                        if (Geomath.isPointInPolygon(outer, inner.coordinates[0])) {
                            polys[i].push(inner.coordinates);
                            break;
                        }
                    }
                    if (i == polys.length) {
                        Logger.warning("No outer polygon found for inner polygon in relation "+relation.osm_id, inner);
                    }
                } else {
                    Logger.warning("Relation "+relation.osm_id+" holds unconnected inner way.");
                }
            })
            res.features.push(new GeoJsonMultiPolygon(relation.osm_id, relation.attrs, polys).convert());
        }
        // Convert other relation ways as MultiLineString
        var way_coords = [];
        for (var key in relation.ways) {
            if (relation.ways.hasOwnProperty(key) && key != 'outer' && key != 'inner') {
                way_coords.push(relation.ways[key].coords);
            }
        }
        if (way_coords.length) {
            res.features.push(new GeoJsonMultiLineString(relation.osm_id, relation.attrs, way_coords).convert());
        }
    })

    var context = this;
    process.nextTick(function() {context.emit("data", res)});
    process.nextTick(function() {context.emit("end")});
}

Util.inherits(GeoJsonStream, Stream);


exports.GeoJsonStream = GeoJsonStream;
