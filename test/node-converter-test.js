/*
* Test cases for node converter
*
* Stefan Wehner (2012)
*/

var NodeConverter = require('../lib/access/node-converter').NodeConverter;

exports.oneNode = function(test) {
    function callback(error, node) {
        test.equal(123, node.osm_id);
        test.deepEqual([71,34], node.loc);
        test.deepEqual({tourism: "viewpoint"}, node.attrs);
        test.equal(true, node.visible);
        test.done();
    }
    var mongoNode = {_id: {osm: 123}, loc: [71,34], version: 1, visible: true, tags: {tourism: "viewpoint"}};
    var ncon = new NodeConverter(null, mongoNode, callback);
}
