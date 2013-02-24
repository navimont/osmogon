/*
* Render Map
*
* Stefan Wehner (2013)
*/

exports.map = function(req,res,next) {
    res.render("map", {title: "osmogon"});
}
