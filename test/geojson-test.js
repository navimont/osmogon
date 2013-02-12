/*
* Test for GeoJsonStream writer
*
* Stefan Wehner (2012)
*/

var GeoJson = require("../lib/writer/geojson");
var GeoJsonStream = GeoJson.GeoJsonStream;
var Node = require('../lib/geometry/node').Node;
var Way = require('../lib/geometry/way').Way;
var Relation = require('../lib/geometry/relation').Relation;

var MockLogger = {
    warning: function(warn) {
        console.log(warn);
    }
}

GeoJson.TestInterface.injectLogger(MockLogger);


exports.streamWriteNodes = {
    setUp: function(callback) {
        // empty osm object
        this.osm = {
            nodes: [],
            ways: [],
            relations: []
        }
        this.nodes = [];
        this.nodes.push(new Node(1,[-71.6,-36.4],true));
        this.nodes.push(new Node(2,[-71.8,6.4],true,{'tourism': "viewpoint"}));
        callback();
    },
    nodes: function(test) {
        var expected = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "id": 1,
              "geometry": {
                "type": "Point",
                "coordinates": [
                  -71.6,
                  -36.4
                ]
              }
            },
            {
              "type": "Feature",
              "id": 2,
              "properties" : {"tourism": "viewpoint"},
              "geometry": {
                "type": "Point",
                "coordinates": [
                  -71.8,
                  6.4
                ]
              }
            }
          ]
        }

        // nodes only
        this.osm.nodes = this.nodes;
        var writer = new GeoJsonStream(this.osm);
        writer.on("data", function(data) {
            test.deepEqual(expected, JSON.parse(data));
            test.done();
        })
    }
}


exports.streamWriteWays = {
    setUp: function(callback) {
        // empty osm object
        this.osm = {
            nodes: [],
            ways: [],
            relations: []
        }
        this.ways = [];
        this.ways.push(new Way(33,1,true).setCoordinates([[1,1],[1,5],[7,1],[7,5]]).addTags({name: "square"}));
        this.ways.push(new Way(44,1,true).setCoordinates([[3,2],[4,5],[5,2]]).addTags({name: "triangle"}));
        callback();
    },
    ways: function(test) {
        var expected = {
          type: 'FeatureCollection',
          features:
           [ { type: 'Feature',
               id: 33,
               properties: { name: 'square' },
               geometry:
                { type: 'Polygon',
                  coordinates: [ [ [ 1, 1 ], [ 1, 5 ], [ 7, 1 ], [ 7, 5 ] ] ] } },
             { type: 'Feature',
               id: 44,
               properties: { name: 'triangle' },
               geometry:
                { type: 'Polygon',
                  coordinates: [ [ [ 3, 2 ], [ 4, 5 ], [ 5, 2 ] ] ]
                }
              }
            ]
          }

        // ways only
        this.osm.ways = this.ways;
        var writer = new GeoJsonStream(this.osm);
        writer.on("data", function(data) {
            test.deepEqual(expected, JSON.parse(data));
            test.done();
        })
    }
}


exports.streamWriteRelation = {
    setUp: function(callback) {
        // empty osm object
        this.osm = {
            nodes: [],
            ways: [],
            relations: []
        }
        var relation = new Relation(111,1,true);
        relation.addWayMember("outer", new Way(33,1,true).setCoordinates([ [-36.881025185721825, -71.62892940841],[-36.861683984864825, -71.6284150049545], [-36.86062566237894, -71.66096939506747], [-36.877204364005586, -71.66111636748333], [-36.881025185721825, -71.62892940841]]));
        relation.addWayMember("inner", new Way(44,1,true).setCoordinates([ [-36.8747942089, -71.634808305], [-36.871972467291194, -71.65384123289826],  [-36.866975377439125, -71.64766839143215],  [-36.8747942089, -71.634808305] ]));
        relation.addNodeMember("", new Node(1,-71.6,-36.4,1,true));
        this.osm.relations.push(relation);
        callback();
    },
    ways: function(test) {
        var expected = { type: 'FeatureCollection',
          features:
           [ { type: 'Feature',
               id: 111,
               geometry:
                { type: 'MultiPolygon',
                  coordinates:
                   [ [ [ [ [ -36.881025185721825, -71.62892940841 ],
                           [ -36.861683984864825, -71.6284150049545 ],
                           [ -36.86062566237894, -71.66096939506747 ],
                           [ -36.877204364005586, -71.66111636748333 ],
                           [ -36.881025185721825, -71.62892940841 ] ],
                         [ [ -36.8747942089, -71.634808305 ],
                           [ -36.871972467291194, -71.65384123289826 ],
                           [ -36.866975377439125, -71.64766839143215 ],
                           [ -36.8747942089, -71.634808305 ] ] ] ] ]
                }
              }
            ]
          }


        var writer = new GeoJsonStream(this.osm);
        writer.on("data", function(data) {
            test.deepEqual(expected, JSON.parse(data));
            test.done();
        })
    }
}
