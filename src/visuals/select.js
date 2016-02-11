"use strict";
var SelectTool = function(visuals) {
    var self = Tool();

    var MODES = {
	none: "none",
	translating: "translating",
	scaling: "scaling", // TODO: scaling isn't implemented yet.
	rotating: "rotating" // TODO: rotating isn't implemented yet.
    }

    var mode = MODES.none;

    var start_coord, last_coord;    
    self.start = function(e) {
	start_coord = e.coords[0];
	last_coord = e.coords[e.coords.length - 1];
	switch ($(e.target).attr("id")) {
	case VisualsView.IDS.selection:
	    mode = MODES.translating;
	    break;
	case VisualsView.IDS.selection_scale:
	    mode = MODES.scaling;
	    break;
	default:
	    break;
	}
	self.update(e, true);
    };

    self.update = function(e, from_start) {
	var current_coord = e.coords[e.coords.length - 1];
	switch (mode) {
	case MODES.none:
	    visuals.selection.update(start_coord, current_coord);
	    break;
	case MODES.translating:
	    var dx = current_coord.x - last_coord.x;
	    var dy = current_coord.y - last_coord.y;
	    visuals.selection.translate(dx, dy, e.vis_t);
	    break;
	default:
	    break;
	}
	last_coord = current_coord;
    }

    self.stop = function(e) {
	self.update(e);

	mode = MODES.none;
	
	// Don't show the box if no visuals were selected
	if (visuals.selection.visuals.getLength() == 0) {
	    visuals.selection.clear();
	}
    }

    var getTranslationMatrix = function(dx, dy) {
	return [[1, 0, dx], [0, 1, dy], [0, 0, 1]];
    };

    
    return self;
};
