"use strict";
var PointerEventManager = function(container_id, coords_comparator_id) {
    var self = EventManager().initializeEvents({
	pointer_down: "pointer_down",
	pointer_drag: "pointer_drag",
	pointer_up: "pointer_up"
    });

    var $container = $("#" + container_id);

    if (coords_comparator_id == null) {
	coords_comparator_id = container_id;
    }
    var $coords_comparator = $("#" + coords_comparator_id);

    var getRelativeCoords = function(pageX, pageY) {
	var offset = $coords_comparator.offset();
	return {x: pageX - offset.left, y: pageY - offset.top};
    };

    var coordsFromEvent = function(e) {
	var coords = [];
	if (isNaN(e.pageX)) { // Touch event
	    var touches = e.originalEvent.changedTouches;
	    for (var i = 0; i < touches.length; i++) {
		var touch = touches[i];
		coords.push(getRelativeCoords(touch.pageX, touch.pageY));
	    }
	} else { // Mouse event
	    coords.push(getRelativeCoords(e.pageX, e.pageY));
	}
	return coords;
    };

    var pointerDown = function(e) {
	e.stopPropagation();
	$(document).on("mousemove", pointerDrag);
	$(document).on("mouseup", pointerUp);		
	$(document).on("touchmove", pointerDrag);
	$(document).on("touchend", pointerUp);
	self.fireEvent(self.EVENT_TYPES.pointer_down,
		       {coords: coordsFromEvent(e), target: e.target});
    };    
    $container.on("mousedown", pointerDown);
    $container.on("touchstart", pointerDown);
    

    var pointerDrag = function(e) {
	self.fireEvent(self.EVENT_TYPES.pointer_drag,
		       {coords: coordsFromEvent(e)});
    };
    
    var pointerUp = function(e) {
	$(document).off("mousemove", pointerDrag);
	$(document).off("mouseup", pointerUp);
	$(document).off("touchmove", pointerDrag);
	$(document).off("touchend", pointerUp);
	self.fireEvent(self.EVENT_TYPES.pointer_up,
		       {coords: coordsFromEvent(e)});
    };

    return self;

};
