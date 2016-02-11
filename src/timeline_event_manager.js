"use strict";
var TimelineEventManager = function() {
    var self = EventManager().initializeEvents({
	zoom_in: "zoom_in",
	zoom_out: "zoom_out",
	move_playhead: "move_playhead"
    });
    
    var MODES = {
	none: "none",
	dragging_playhead: "dragging_playhead"
    };
    
    var mode = MODES.none;
    var $timeline = $("#" + TimelineView.IDS.timeline);
    
    //// Helpers
    
    var getRelativeCoords = function(pageX, pageY) {
	var offset = $timeline.offset();

	// Account for GRAPH_MARGIN
	offset.left += TimelineView.GRAPH_MARGIN;
	offset.top += TimelineView.GRAPH_MARGIN;

	// Account for scrollLeft
	offset.left += $timeline.scrollLeft();
	
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

    //// Event Handling

    var controlsClickHandler = function(e) {
	var event_type;
	switch ($(e.target).attr("id")) {
	case TimelineView.IDS.zoom_in:
	    event_type = self.EVENT_TYPES.zoom_in;
	    break;
	case TimelineView.IDS.zoom_out:
	    event_type = self.EVENT_TYPES.zoom_out;
	    break;
	default:
	    break;
	}
	if (event_type != null) {
	    self.fireEvent(event_type, {});
	}
    };
    $("#" + TimelineView.IDS.controls).click(controlsClickHandler);
   
    var pointerDown = function(e) {
	var event_type;
	var args;
	switch(mode) {
	case MODES.none:
	    if ($(e.target).attr("id") == TimelineView.IDS.playhead) {
		mode = MODES.dragging_playhead;
		event_type = self.EVENT_TYPES.move_playhead;
		args = {coords: coordsFromEvent(e)};
	    }
	    break;
	default:
	    break;
	}
	if (event_type != null) {
	    self.fireEvent(event_type, args);
	}
    };
    //TODO: did you include touchstart for other mode-type things in other event managers?
    $timeline.on("mousedown", pointerDown);
    $timeline.on("touchstart", pointerDown);

    var pointerMove = function(e) {
	var event_type;
	var args;
	switch (mode) {
	case MODES.dragging_playhead:
	    event_type = self.EVENT_TYPES.move_playhead;
	    args = {coords: coordsFromEvent(e)};
	    break;
	default:
	    break;
	}
	if (event_type != null) {
	    self.fireEvent(event_type, args);
	}
    };
    $(document).on("mousemove", pointerMove);
    $(document).on("touchmove", pointerMove);

    var pointerUp = function(e) {
	var event_type;
	var args;
	switch (mode) {
	case MODES.dragging_playhead:
	    event_type = self.EVENT_TYPES.move_playhead;
	    args = {coords: coordsFromEvent(e)};
	    mode = MODES.none;
	    break;
	default:
	    break;
	}
	if (event_type != null) {
	    self.fireEvent(event_type, args);
	}
    };
    $(document).on("mouseup", pointerUp);
    $(document).on("touchstop", pointerUp);

    return self;
};
