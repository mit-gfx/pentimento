"use strict";
var TrackEventManager = function(track_id) {
    var MODES = {
	none: "none",
	dragging: "dragging",
	cropping: "cropping",
	selecting: "selecting",
	done_selecting: "done_selecting"
    };
    
    var EVENT_TYPES = {
	clear_select: "clear_select"
    };
    EVENT_TYPES[MODES.dragging] = {
	start: "start_segment_drag",
	update: "update_segment_drag",
	stop: "stop_segment_drag"
    };
    EVENT_TYPES[MODES.cropping] = {
	start: "start_segment_crop",
	update: "update_segment_crop",
	stop: "stop_segment_crop"
    };
    EVENT_TYPES[MODES.selecting] = {
	start: "start_select",
	update: "update_select",
	stop: "stop_select"
    };
    
    var self = EventManager().initializeEvents(EVENT_TYPES);    
    var mode = MODES.none;

    var TRACK_SELECTOR = "#" + track_id;
    // selectors for segments/handles within this track only
    var SEGMENT_SELECTOR = TRACK_SELECTOR + " ." + SegmentView.CLASSES.segment
    var HANDLE_SELECTOR = TRACK_SELECTOR + " ." + SegmentView.CLASSES.handle;

    var mousedownHandler = function(e) {
	if (mode === MODES.done_selecting) {
	    self.fireEvent(self.EVENT_TYPES.clear_select, {});
	    mode = MODES.none;
	}

	var event_type;
	var event_args = getRelativeCoords(e, $(TRACK_SELECTOR));
	var $target = $(e.target);
	
	var segment = $target.closest(SEGMENT_SELECTOR)[0];
	if (segment) {
	    var $segment = $(segment);
	    var left = $segment.css("left");
	    left = left.substring(0, left.length - 2);	    
	    event_args.segment_id = $segment.attr("id");
	    event_args.segment_start_x = left;
	}
	
	if ($target.hasClass(SegmentView.CLASSES.drag)) {
	    mode = MODES.dragging;	    
	} else if ($target.hasClass(SegmentView.CLASSES.crop_start)) {
	    mode = MODES.cropping;
	    event_args.crop_from_start = true;
	} else if ($target.hasClass(SegmentView.CLASSES.crop_end)) {
	    mode = MODES.cropping;
	    event_args.crop_from_start = false;
	} else {
	    mode = MODES.selecting;
	}
	
	if (EVENT_TYPES[mode] != null) {
	    self.fireEvent(EVENT_TYPES[mode].start, event_args);
	}
    };
    $(document).on("mousedown", TRACK_SELECTOR, mousedownHandler);
    
    var mousemoveHandler = function(e) {
	if (mode === MODES.none || mode === MODES.done_selecting) {
	    return;
	}
	
	var event_args = getRelativeCoords(e, $(TRACK_SELECTOR));

	if (mode === MODES.selecting) {
	    var closest = $(e.target).closest(SEGMENT_SELECTOR);
	    if (closest.length > 0) {
		event_args.segment_id = $(closest[0]).attr("id");
	    }
	}
	
	if (EVENT_TYPES[mode] != null) {
	    self.fireEvent(EVENT_TYPES[mode].update, event_args);
	}
    };
    $(document).on("mousemove", mousemoveHandler);
    // Note: mousemove and mouseup are on the entire document in case the user
    // leaves the track element while dragging/cropping. Since that's a lot
    // of extra events, we put the check to see if mode == MODES.none at the
    // top of the handlers. I don't know if that's faster than just binding/
    // unbinding the handlers as needed or not.
    
    var mouseupHandler = function(e) {
	if (mode === MODES.none || mode === MODES.done_selecting) {
	    return;
	}

	// Have to define event_type now before the mode is changed
	var event_type = EVENT_TYPES[mode] ? EVENT_TYPES[mode].end : null
	var event_args = getRelativeCoords(e, $(TRACK_SELECTOR));

	if (mode === MODES.selecting) {
	    mode = MODES.done_selecting;
	} else {
	    mode = MODES.none;
	}
	
	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}
    };
    $(document).on("mouseup", mouseupHandler);

    return self;
};
