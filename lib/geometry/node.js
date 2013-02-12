/*
* Node (geographic location) object
*
* Stefan Wehner (2012)
*/

exports.Node = Node;

function Node(osm_id, loc, visible, attrs) {
    this.visible = visible;
    this.loc = loc;
    this.osm_id = osm_id;
    this.attrs = attrs;
}

