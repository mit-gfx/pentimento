"use strict";

// Manages the lecture time
// Time is kept to whole millisecond units.
var TimelineController = function(timeline, lecture) {   
    var self = {}
    var evt_mgr = TimelineEventManager();
    var view = TimelineView(timeline, lecture);

    var ZOOM_IN_FACTOR = 1.5;
    var ZOOM_OUT_FACTOR = 1/ZOOM_IN_FACTOR;

    var zoom = function(zoom_in) {
        var factor = (zoom_in ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR);
        timeline.px_per_ms.set(timeline.px_per_ms.get() * factor);	
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.zoom_in, function() {
        zoom(true);
    });
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.zoom_out, function() {
        zoom(false);
    });

    // TODO: re-implement the functionality that allows users to click the
    //    timeline to move the playhead position. It's currently missing.
    
    var changeTime = function(e) {
	var left = e.coords[e.coords.length - 1].x;
	var time = timeline.pixelsToAudioTime(left);

	// The view will update when the current_time change event is fired
	if (time >= 0) {
	    lecture.timer.current_time.set(time);

	} else {
	    lecture.timer.current_time.set(0);
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.move_playhead, changeTime);        

    var updateTimelineLength = function() {
	// TODO: this max call shouldn't be necessary once the duration updates
	// with current_time.
        var lecture_length = Math.max(lecture.getDuration(),
				      lecture.timer.current_time.get());
	timeline.length.set(2*lecture_length);
    };
    // TODO: once duration updates with current_time, this can be attached
    //  to duration to minimize the number of callbacks.
    lecture.timer.current_time.addEventListener(updateTimelineLength);

    lecture.timer.current_time.addEventListener(view.updatePlayhead);
    timeline.length.addEventListener(view.refreshGradations);
    
};
