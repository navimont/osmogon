var OsmMongo = require('./lib/osm-mongo').OsmMongo;
var GeoJsonStream = new require('./lib/writer/geojson.js').GeoJsonStream;


var osm = new OsmMongo();

osm.findOsmNear([-73.9727,40.6947],0.5,{highway: "residential"},function(error,result) {
//osm.findOsm({highway: "residential"},function(error,result) {
    if (error) {
        console.log("ERROR "+error);
        return;
    }
    var json_stream = new GeoJsonStream(result);
    json_stream.on("data", function(data) {
        console.log(data);
    })
    json_stream.on("end", function() {
        console.log('done.');
    })
})
