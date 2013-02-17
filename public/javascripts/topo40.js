/*
Render map in topo style

Stefan Wehner (2012-2013)
*/

function render() {
osmogon = new Osmogon("#map");
osmogon.setScale(3000000);      // reduction scale
osmogon.setLongitude(-73.9723);  // center longitude
osmogon.setLatitude(40.6946);   // center latitude

osmogon.backdrop("backdrop");

var green = osmogon.osmdata('green').load({'leisure': {"$in": ['park']}});

var water = osmogon.osmdata('water').load({'natural':'water'});

// Register footpath as new osmdata feature. The order of features matters for the order of drawing
// data is loaded asynchronously. The name string given to the collection is the name of the layer
// on which it is drawn.
var footpath = osmogon.osmdata('roads');
footpath.load({"highway": {"$in": ["path", "footway", "cycleway", "bridleway", "service", "track", "steps"]}});

var road = osmogon.osmdata('roads').load({'highway': {"$in": ['secondary','tertiary','unclassified','residential']}});
var carretera = osmogon.osmdata('main_roads').load({'highway': 'primary'});


green.draw(function(tags, attrs) {
    return {"class": "green"};
});

water.draw(function(tags, attrs) {
  return {"class": "water"};
});

// concatenated draws cause the feature to be drawn multiple times
// for example to achieve effects like glow, separate from the
// background or lines of different color.
footpath
  .draw(function(tags, attrs) {
    return {"class": "path_casing"};
  })
 .draw(function(tags, attrs) {
      if (tags.grade > 3) {
          return {"class": "path_alpine"};
      } else {
          return {"class": "path"};
      }
});

river.draw(function(){return {"style": "stroke-width: 1.5px; stroke: blue; fill: none;"}});

road.draw(function() {
    return {"style": "stroke-width: 3.5px; stroke: black; fill: none;"};
 })
 .draw(function() {
    return {"style": "stroke-width: 2.5px; stroke: lemonchiffon; fill: none;"};
 });

carretera
 .draw(function() {
    return {"class": "road_casing"};
 })
 .draw(function() {
    return {"class": "carretera"};
 });


}
