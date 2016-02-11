"use strict";
var ConstraintEventManager = function(constraint_id) {
    var self = EventManager().initializeEvents({
	start_drag: "start_drag",
	update_drag: "update_drag",
	end_drag: "end_drag"
    });

    var $constraints = $("#" + RetimerView.IDS.constraints);    
    
    var mousedownHandler = function(e) {
	var rel_coords = getRelativeCoords(e, $constraints);
	var drag_audio = rel_coords.y > ($constraints.height()/2);
	var event_args = {x: rel_coords.x, dx: e.x,
			  drag_audio: drag_audio};
	self.fireEvent(self.EVENT_TYPES.start_drag, event_args);
	$(document).on("mousemove", dragHandler);
	$(document).on("mouseup", mouseupHandler);
    };
    $constraints.setLayer(constraint_id, {mousedown: mousedownHandler});

    var dragHandler = function(e) {
	var rel_coords = getRelativeCoords(e, $constraints);
	self.fireEvent(self.EVENT_TYPES.update_drag, rel_coords);
    };

    var mouseupHandler = function(e) {
	var rel_coords = getRelativeCoords(e, $constraints);
	self.fireEvent(self.EVENT_TYPES.end_drag, rel_coords);
	$(document).off("mousemove", dragHandler);
	$(document).off("mouseup", mouseupHandler);
    };

    return self;
};
