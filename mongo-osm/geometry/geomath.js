/*
* Some useful functions for geometrical calculations
*
* Stefan Wehner (2012)
*/
var Line = require('sylvester').Line;
var Vector = require('sylvester').Vector;
var assert = require('assert');

var R = 6371000; // earth radius meters
var deg2rad = Math.PI / 180;
var deg2meter = Math.PI*R/180;

exports.TestInterface = {
    dropTheMiddleman: dropTheMiddleman,
    processForwardInTriplets: processForwardInTriplets,
    processBackwardInTriplets: processBackwardInTriplets
}


// returns true if p0 and p1 have the same coordinates
function same(p0, p1) {
    return (Math.abs(p0[0] - p1[0]) < 1e-9 && Math.abs(p0[1] - p1[1]) < 1e-9);
}
exports.same = same;

// Return spherical distance between points on earth surface in meters
// p1 and p2 given as array [lon,lat]
function pointDistance(p1, p2) {
    var lon1 = p1[0] * deg2rad;
    var lon2 = p2[0] * deg2rad;
    var lat1 = p1[1] * deg2rad;
    var lat2 = p2[1] * deg2rad;

    a =  Math.sin(lat1)*Math.sin(lat2) +
                  Math.cos(lat1)*Math.cos(lat2) *
                  Math.cos(lon2-lon1);
    // due to rounding errors a may exceed the legal argument range for acos
    if (a < -1.0) {
        a = -1.0;
    }
    if (a > 1.0) {
        a = 1.0;
    }
    return Math.acos(a) * R;
}

exports.pointDistance = pointDistance;


exports.wayLength = function(coords) {
    var len = 0;
    coords.forEach(function(c, i, ca) {
        if (i > 0) {
            len += pointDistance(c,ca[i-1]);
        }
    })
    return len;
}


// Eliminate points from a way unnecessary at a coarse precision
function scarceWay(coords, deviation) {
    // one node minimum
    assert(coords.length);
    if (coords.length < 2) {
        return coords;
    }

    // 2-node way
    if (coords.length == 2) {
        if (pointDistance(coords[0],coords[1]) <= deviation) {
            // for a 2-point way with minimal length, shrink to a single point
            return [[(coords[0][0]+coords[1][0])*0.5, (coords[0][1]+coords[1][1])*0.5]];
        } else {
            return coords;
        }
    }

    // 3-plus-node-way
    var scarce = processForwardInTriplets(coords, deviation, dropTheMiddleman);
    scarce = processBackwardInTriplets(coords, deviation, dropTheMiddleman);

    // call recursively as long as the scarcity can be improved
    if (scarce.length < coords.length) {
        return scarceWay(scarce, deviation);
    }

    return scarce;
}

exports.scarceWay = scarceWay;

function dropTheMiddleman(p0,p1,p2,deviation) {
    var tf = new Transform(p0);
    var line = Line.create([0,0],tf.getXY(p2));
    var middleman_deviation;
    if (line == null) {
        // happens when p2 == p0
        middleman_deviation = pointDistance(p0, p1);
    } else {
        middleman_deviation = line.distanceFrom(tf.getXY(p1))
    }
    // if the middle node is off by less than deviation from the
    // direct line between node[0] and node[2] it can be eliminated.
    // Do not eliminate if the distance between nodes becomes too big.
    if (middleman_deviation >= deviation
        || pointDistance(p0, p2) > (7 * deviation) )
    {
        // keep middle point
        return [p0,p1,p2];
    }
    return [p0,p2];
}

function processForwardInTriplets(coords, deviation, processor) {
    var scarce = [coords[0]];
    var i;
    for (i=2; i < coords.length; i+=2) {
        var reminder = processor(coords[i-2], coords[i-1], coords[i], deviation);
        reminder.slice(1).forEach(function(c) {
            scarce.push(c);
        });
    }
    if (i == coords.length) {
        // last point was skipped
        scarce.push(coords[coords.length-1]);
    }
    return scarce;
}

function processBackwardInTriplets(coords, deviation, processor) {
    var scarce = [coords[coords.length-1]];
    var i;
    for (i=coords.length-3; i >= 0; i-=2) {
        var reminder = processor(coords[i], coords[i+1], coords[i+2], deviation);
        if (reminder.length == 3) {
            scarce.unshift(reminder[1]);
        };
        scarce.unshift(reminder[0]);
    }
    if (i == -1) {
        // last point was skipped
        scarce.unshift(coords[0]);
    }
    return scarce;
}

// calls function func for every coordinate pair in coord array
function mapCoordinatePairs(coords, func) {
    var counter = 0;
    for (var i=0; i < coords.length; i++) {
        if (func(coords[i],coords[(i+1)%coords.length])) {
            counter++;
        }
    }
    return counter;
}


// Return true if vector v originating from p (ray)
// intersects the line made from p0 and p1 between these two points
function rayIntersectsBetweenPoints(p, v, p0, p1) {
    var pl = Line.create(p0,[p1[0]-p0[0],p1[1]-p0[1]]);
    var vl = Line.create(p,[v.e(1), v.e(2)]);
    var x = vl.intersectionWith(pl);
    if (x) {
        // p0x is the vector from p0 towards the intersection
        var p0x = Vector.create([x.e(1)-p0[0], x.e(2)-p0[1]]);
        if (p0x.modulus() == 0) {
            // p0 and x are the same
            return true;
        }
        // px goes from p to intersection x
        var px = Vector.create([x.e(1)-p[0], x.e(2)-p[1]]);
        if (v.isAntiparallelTo(px)) {
            return false;
        }
        // p1p2 is the vector from p0->p1
        var p1p2 = Vector.create([p1[0]-p0[0],p1[1]-p0[1]]);
        // p1p2 points in the same direction as px and its length is smalled than the length of px
        return (p0x.isParallelTo(p1p2) && (p0x.modulus() / p1p2.modulus() <= 1.0));
    } else {
        return false;
    }
}

exports.rayIntersectsBetweenPoints = rayIntersectsBetweenPoints;


// Return True if point is in polygon, False otherwise
function isPointInPolygon(poly, p) {
    // count the ray's intersections with polygon
    var tf = new Transform(p);
    function intersect(p1, p2) {
        pc1 =  tf.getXY(p1);
        pc2 =  tf.getXY(p2);
        // construct a ray starting from the point p
        // (transformed to the origin of a cartesian coordinate system)
        return rayIntersectsBetweenPoints([0,0],Vector.create([1,1]),pc1, pc2);
    }
    var count = mapCoordinatePairs(poly.slice(1), intersect);

    // if the number of intersections is odd, then the point is inside
    return !!(count & 1);
}

exports.isPointInPolygon = isPointInPolygon;

// Initialize transformation routines with a base point [lon,lat]
Transform = function(p0) {
    this.lon = p0[0];
    this.lat = p0[1];
}

// return XY coordinats of point p1 with respect to the class base point p0
Transform.prototype.getXY = function(p1) {
    var x = (p1[0] - this.lon) * deg2meter;
    var y = (p1[1] - this.lat) * deg2meter * Math.log(Math.tan(0.25*Math.PI + 0.5*this.lat*deg2rad));

    return [x,y];
}

// return lat,lon coordinates of a point in the local merkator tangential plane
Transform.prototype.getLatLon = function(xy) {
    var lon = this.lon + xy[0] / deg2meter;
    var lat = this.lat + xy[1] / deg2meter / Math.log(Math.tan(0.25*Math.PI + 0.5*this.lat*deg2rad));

    return [lon,lat];
}

exports.Transform = Transform;




