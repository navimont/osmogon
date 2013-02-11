/**
* Read osm file (in XML format) and write the contents to mongo DB
*
* Start with:
* $ node osm-mongo-loader.js <osmfile>
*
* Stefan Wehner (2012)
*/

var fs = require("fs");
var util = require("util");
var assert = require('assert');

var Settings = require('./lib/util/settings').getSettings();
var Parser = require("./lib/parser/osm-parser");
var MongoOsm = require('./lib/mongo/mongo-connect');
var Logger = require("./lib/util/logger");

// read osm file name from command line and open stream
var filename = process.argv.pop();


fs.stat(filename, function(err,stats) {
    if (err) {
        console.log("Can't open file: "+filename);
        process.exit(-1);
    }
    // connect to DB
    MongoOsm.connect(Settings.MONGO_HOST, Settings.MONGO_PORT, function() {
        Logger.info('Start parsing', {'file': filename});

        // start parsing file
        var stream = fs.createReadStream(filename);
        var osm_parser = new Parser(stream, filename, missingCallback, elementCallback, parserHeartbeat, function() {
            console.log("Done.")
            process.exit(0);
        });
        console.log("Start parsing "+filename+"...")
    });
})

function missingCallback(missing) {
    // don't care
}

function elementCallback(data) {
    // don't care
}

function parserHeartbeat(stat) {
    Logger.info('parser statistics', stat);
    console.log(util.format("Found %d nodes, %d ways and %d relations (%d queued for DB write).", stat.nodes, stat.ways, stat.relations, stat.dbqueue));
}

