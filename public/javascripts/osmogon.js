/*
Osmogon is d3-based svg renderer for maps.


Stefan Wehner (2012)
*/


// instantiate class and give DOM element where the map attaches to as parameter
function Osmogon(element) {
    this.root_element = element;
    var relem = document.getElementById(element);
    this.width = relem && relem.width() ? relem.width() : 600;
    this.height = relem && relem.height() ? relem.height() : 800;
    this.lon = -36.8;
    this.lat = -71.6;
    this.scale = 10500;    // pixel per degree (with 96dpi)
    this.projection = d3.geo.mercator();
    this.initViewport();
    this.canvas = undefined;
    this.layers = [];
    this.osm = [];         // downloaded Osmdata
};

Osmogon.help = {help: "d3 wrapper for drawing OSM maps"};
Osmogon.prototype.setWidth = function(w) {
    this.width = w;
    this.initViewport();
};
Osmogon.prototype.setHeight = function(h) {
    this.height = h;
    this.initViewport();
};
Osmogon.prototype.setScale = function(s) {
    this.scale = s;
    this.initViewport();
};
// Set center point longitude
Osmogon.prototype.setLongitude = function(lon) {
    this.lon = lon;
    this.initViewport();
};
// Set center point latitude
Osmogon.prototype.setLatitude = function(lat) {
    this.lat = lat;
    this.initViewport();
};
Osmogon.prototype.setProjection = function(d3_projection) {
    this.projection = d3_projection;
    this.initViewport();
}
// sets viewport and initializes projection
Osmogon.prototype.initViewport = function() {
    if (this.lon && this.lat && this.scale && this.width && this.height) {
        // specify scale and translation
        this.projection.scale(this.scale);
        this.projection.translate([0,0]);     // reset coordinate shift
        var origin = this.projection([-1*this.lon,-1*this.lat]);
        var center = [origin[0]+this.width/2, origin[1]+this.height/2];
        this.projection.translate(center);    // and set it to our center position

        this.viewport = [this.projection.invert([0,this.height]),this.projection.invert([this.width,0])];
        return this.viewport;
    } else {
        return undefined;
    }
}
Osmogon.prototype.getViewport = function() {
    return this.viewport;
}
// add as a new layer (if layer with the given name does not exist yet)
Osmogon.prototype.addLayer = function(layer) {
    if (this.layers.indexOf(layer) < 0) {
        this.layers.push(layer);
    }
};
// draw a backdrop behind the (future) map
Osmogon.prototype.backdrop = function(clazz) {
    if (!this.width || !this.height) {
        return;
    }
    this.canvas = d3.select(this.root_element)
      .append("svg:svg")
      .attr("width", this.width)
      .attr("height", this.height);

    var g = this.canvas.append("svg:g");

    var border = g.append("svg:rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", clazz);
};
Osmogon.prototype.osmdata = function(layer) {
    this.addLayer(layer);
    var od = new Osmdata(this,layer);
    // remember associated osmdata objects
    this.osm.push(od);
    return od;
}
// called by osmdata when all data is loaded
Osmogon.prototype.readyToRender = function() {
    // check if all associated data objects are ready
    for (var i=0; i<this.osm.length; i++) {
        var od = this.osm[i];
        if (!od.isLoaded()) {
            return;
        }
    }

    var path_renderer = d3.geo.path();
    path_renderer.projection(this.projection);

    // go through all layers
    for (var l=0; l<this.layers.length; l++) {
        var layer_name = this.layers[l];
        for (var i=0; i<this.osm.length; i++) {
            var od = this.osm[i];
            if (od.layer == layer_name) {
                od.render(this.canvas, layer_name, path_renderer);
            }
        }
    }
}

function Osmdata(osmogon,layer) {
    this.osmogon = osmogon;
    this.layer = layer;
    this.num_loads = 0;
    this.id = 'OD'+Osmdata.prototype.createId();
    // microlayers are used for the layer attribute which runs from -5 to 4
    this.microlayer = [[],[],[],[],[],[],[],[],[],[]];
    // callbacks for line, text, markers etc.
    this.draw_callbacks = [];
}
Osmdata.prototype.proto_id = 0;
Osmdata.prototype.createId = function() {
    return Osmdata.prototype.proto_id++;
}
// standard load function queries the osmogon bbox
Osmdata.prototype.load = function(query) {
    this.query = JSON.stringify(query);
    var viewport = this.osmogon.getViewport();
    if (!viewport) {
        throw "Could not get viewport from osmogon";
    }
    var locator = "/osm?minlon="+viewport[0][0]+"&minlat="+viewport[0][1]+"&maxlon="+viewport[1][0]+"&maxlat="viewport[1][1]
    this.loadRequest(locator,query);
    return this;
}
Osmdata.prototype.loadRequest = function(locator, query) {
    this.num_loads++;
    var context = this;

    // make sure that the callback remembers the context class
    var cb_wrapper = function(data) {
        context.loadCbHandler.call(context, data);
    }

    var url = locator+"&query="+JSON.stringify(query);
    d3.json(url, cb_wrapper);
    return this;
}
Osmdata.prototype.isLoaded = function() {
    return this.num_loads == 0;
}
Osmdata.prototype.slice = function(criteria) {
    // TODO this will be tricky
}
// called when data is loaded
Osmdata.prototype.loadCbHandler = function(data) {
    // on error, data will be null
    if (data) {
        // microlayer separates the different layers defined by the osm layer tag
        // layer=0 or no layer tag is put into microlayer[5]
        var microlayer = this.microlayer;
        for (var i=0; i<data.features.length; i++) {
            var feature = data.features[i];
            if ("layer" in feature.properties) {
                var layer = parseInt(feature.properties.layer);
                if (layer >= -5 && layer < 5) {
                    microlayer[layer+5].push(feature);
                }
            } else {
                microlayer[5].push(feature);
            }
        }
    }
    this.num_loads--;
    if (this.num_loads == 0) {
        this.osmogon.readyToRender();
    }
};
Osmdata.prototype.marker = function(query, func) {
    return this;
}
Osmdata.prototype.label = function(func) {
    return this;
}
Osmdata.prototype.text_label = function(func) {
    return this;
}
Osmdata.prototype.draw = function(func) {
    this.draw_callbacks.push({"draw": func});
    return this;
}
// is called to render the given layer
Osmdata.prototype.render = function(svg_root, layer_name, path_func) {
    // pending load data
    if (this.num_loads != 0) {
        return;
    }
    // check if callbacks are defined for this layer, return otherwise
    if (this.draw_callbacks.length == 0) {
        return;
    }

    // add group for the layer (if it doesn't exist)
    var svg_layer_group = svg_root.selectAll(layer_name)
        .data([1]).enter()
        .append("svg:g")
        .attr("id", layer_name);

    for (var l=0; l<this.draw_callbacks.length; l++) {
        // is there a draw callback associated with this layer?
        var draw_cb = this.draw_callbacks[l];
        for (draw_cmd in draw_cb) {
            if (draw_cb.hasOwnProperty(draw_cmd)) {
                // add group for data held by this object (if it doesn't exist)
                var svg_layer_osmdata = svg_layer_group.selectAll(this.id)
                    .data([1]).enter()
                    .append("svg:g")
                    .attr("id", this.id);

                // loop over microlayers
                for (var m=0; m<this.microlayer.length; m++) {
                    var ml = this.microlayer[m];
                    for (var f=0; f<ml.length; f++) {
                        var feature = ml[f];
                        var path = svg_layer_osmdata.selectAll("path"+feature.id)
                            .data([feature])
                            .enter().append("path")
                            .attr("d", path_func)
                            .attr("id", feature.id);
                        // call the callback function with the properties
                        var attrs = draw_cb[draw_cmd](feature.properties);
                        for (attr in attrs) {
                            if (attrs.hasOwnProperty(attr)) {
                                path.attr(attr, attrs[attr]);
                            }
                        }
                    }
                }
            }
        }
    }
}
