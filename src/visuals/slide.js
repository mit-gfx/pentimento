"use strict";
///////////////////////////////////////////////////////////////////////////////
// Slides
//
// Each slide contains visual elements (one of the VisualTypes)
// Slides can also have a transform
///////////////////////////////////////////////////////////////////////////////
var Slide = function(t_min) {
    // Transformation functionality is built into the Visual class.
    var self = Visual(t_min, VisualProperties("#000", 0, "calligraphic")); // dummy props
    self.visuals = Accessor([]);    
    self.duration = Accessor(0);
    
    self.saveToJSON = function() {
        var json_object = {
            visuals: [],
            duration: self.duration.get()
        };

	var iter = self.visuals.iterator();
	while (iter.hasNext()) {
	    json_object.visuals.push(iter.next().saveToJSON());
	}

        return json_object;
    };
    
    return self;
};

Slide.loadFromJSON = function(json_object) {
    var json_visuals = json_object.visuals;
    var loaded_visuals = [];
    for (var i = 0; i < json_visuals.length; i++) {
        loaded_visuals.push(Visual.loadFromJSON(json_visuals[i]))
    };

    var slide = Slide();
    slide.visuals.set(visuals);
    slide.duration.set(json_object.duration);

    return slide;
};

