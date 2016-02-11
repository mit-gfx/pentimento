"use strict";
var RetimerEventManager = function() {
    var self = EventManager().initializeEvents({
	add_constraint: "add_constraint",
	delete_constraints: "delete_constraints",
	start_selection: "start_selection",
	update_selection: "update_selection",
	clear_selection: "clear_selection"
    });
    
    var MODES = {
	none: "none",
	adding_constraint: "adding_constraint",
	selecting: "selecting",
	done_selecting: "done_selecting"
    };

    var mode = MODES.none; //TODO: should this be an accessor for undo purposes?

    var changeMode = function(new_mode) {
	if (!(new_mode in MODES)) {
	    throw Error("Unsupported mode: " + new_mode);
	} else if (mode == MODES.done_selecting) {
	    self.fireEvent(self.EVENT_TYPES.clear_selection, null);
	}
	mode = new_mode;
    };

    var $constraints = $("#" + RetimerView.IDS.constraints);

    var W = ConstraintView.WIDTH;
    var R = ConstraintView.HANDLE_RADIUS;
    // returns true if the (x, y) position is over a constraint arrow.
    var overConstraint = function(x, y) {
	var constraint_layers = $constraints.getLayerGroup(
	    ConstraintView.LAYER_GROUP);
	for (var i = 0; i < constraint_layers.length; i++) {
	    var layer = constraint_layers[i];
	    var x_margin = Math.abs(layer.x1 - x);
	    if (x_margin <= W/2 + 1) {
		return true;
	    } else if (x_margin <= R && (Math.abs(layer.y1 - y) <= R ||
					 Math.abs(layer.y2 - y) <= R )) {
		return true;
	    }
	}
	return false;
    };

    var clickHandler = function(e) {
	switch ($(e.target).attr("id")) {
	case RetimerView.IDS.add_constraint:
	    changeMode(MODES.adding_constraint);
	    break;
	case RetimerView.IDS.delete_constraints:
	    self.fireEvent(self.EVENT_TYPES.delete_constraints, {});
	    changeMode(MODES.none);
	    break;
	default:
	    break;
	}
    };
    $("#" + RetimerView.IDS.controls).click(clickHandler);
        
    var mousedownHandler = function(e) {
	var rel_coords = getRelativeCoords(e, $constraints);
	var event_type, event_args;
	switch (mode) {
	case MODES.adding_constraint:
	    event_type = self.EVENT_TYPES.add_constraint;
	    event_args = {x: rel_coords.x};
	    changeMode(MODES.none);
	    break;
	case MODES.selecting:
	    // Theoretically we shouldn't ever be in this mode during
	    // mousedown, but sometimes weird stuff happens. Treat it as being
	    // done with selecting by letting the code go to the next case.    
	case MODES.done_selecting:
	    event_type = self.EVENT_TYPES.clear_selection;
	    event_args = {};
	    changeMode(MODES.none);
	    // Don't break here, want to run through MODES.none case
	case MODES.none:
	    // Only start selecting if the user isn't moving a constraint
	    if (!overConstraint(rel_coords.x, rel_coords.y)) {
		changeMode(MODES.selecting);
		event_type = self.EVENT_TYPES.start_selection;
		event_args = {x: rel_coords.x};
	    }
	    break;
	default:
	    break;
	}
	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}	
    };
    $constraints.mousedown(mousedownHandler);

    var mousemoveHandler = function(e) {
	switch (mode) {
	case MODES.none:
	    return;
	case MODES.selecting:
	    var event_type = self.EVENT_TYPES.update_selection;
	    var event_args = getRelativeCoords(e, $constraints);
	    break;
	default:
	    break;	    
	}
	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}	
    };
    $(document).mousemove(mousemoveHandler);

    var mouseupHandler = function(e) {
	switch (mode) {
	case MODES.none:
	    return;
	case MODES.selecting:
	    var event_type = self.EVENT_TYPES.update_selection;
	    var event_args = getRelativeCoords(e, $constraints);
	    changeMode(MODES.done_selecting);
	    break;
	default:
	    break;
	}	
	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}
    };
    $(document).mouseup(mouseupHandler);
    // Note that mousemove and mouseup are on the entire document so
    // selection still updates if the cursor moves off $constraints. It returns
    // immediately if mode is MODES.none, but would  performance be better if
    // we bind/unbind these instead? 
    
    return self;
};

var getRelativeCoords = function(e, element) { //TODO: find proper place for this
    var x, y;
    var offset = $(element).offset();
    
    if (e.pageX != null) { // Mouse event
	x = e.pageX - offset.left;
        y = e.pageY - offset.top;
    } else if (e.eventX != null) { // jCanvas event
	// These are already relative
	x = e.eventX;
	y = e.eventY;	
    } else { // Touch event	
        var touches = e.originalEvent.changedTouches;
        var xSum = 0
        var ySum = 0

        for (var i=0; i < touches.length; i++) {
            xSum += touches[i].pageX
            ySum += touches[i].pageY
        };

        x = xSum/touches.length - offset.left;
        y = ySum/touches.length - offset.top;
    
    }

    return {x: x, y: y};
};
