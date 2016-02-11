"use strict";
var AudioTrackController = function(track, parent_id, lecture) {
    var self = {};

    var evt_mgr = TrackEventManager(track.getID());
    var selection = track.segment_selection;

    // Segment Dragging    
    var last_x, orig_x, offset, segment_index, segment_id;
    
    var initDrag = function(e) {
	last_x = e.x;
	orig_x = last_x;
	segment_id = e.segment_id;
	segment_index = track.indexBySegmentID(segment_id);
	offset = last_x - e.segment_start_x;
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.dragging.start, initDrag);

    var drag = function(e) {
	var delta_x = e.x - orig_x;
	var delta_t_aud = lecture.timeline.pixelsToAudioTime(delta_x);
	if (track.canShiftSegment(segment_index, delta_t_aud)) {
	    view.manuallyChangeSegment(segment_id, e.x - last_x);
	    last_x = e.x;
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.dragging.update, drag);

    var endDrag = function(e) {
	drag(e);

	var delta_x = last_x - orig_x;
	var delta_t_aud = lecture.timeline.pixelsToAudioTime(delta_x);
	track.shiftSegment(segment_index, delta_t_aud);
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.dragging.stop, endDrag);


    // Segment Cropping
    var crop_from_start, last_x, orig_x, segment_index, segment_id;

    var initCrop = function(e) {
	orig_x = e.x;
	last_x = orig_x;
	crop_from_start = e.crop_from_start;
	segment_id = e.segment_id;
	segment_index = track.indexBySegmentID(segment_id);
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.cropping.start, initCrop);

    var updateCrop = function(e) {
	var delta_x = e.x - orig_x;
	var delta_t_aud = lecture.timeline.pixelsToAudioTime(delta_x);
	var can_crop;
	if (crop_from_start) {
	    can_crop = track.canChangeSegmentTimes(segment_index,
							  delta_t_aud, 0);
	} else {
	    can_crop = track.canChangeSegmentTimes(segment_index, 0,
							  delta_t_aud);
	}
	if (can_crop) {
	    var delta = last_x - e.x;
	    if (crop_from_start) {
		view.manuallyChangeSegment(segment_id, -delta, delta);
		view.manuallyChangeWavesurfer(segment_id, delta);
	    } else {
		view.manuallyChangeSegment(segment_id, 0, -delta);
	    }
	    last_x = e.x;
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.cropping.update, updateCrop);

    var endCrop = function(e) {
	updateCrop(e);
	var delta_x = last_x - orig_x;
	var delta_t_aud = lecture.timeline.pixelsToAudioTime(delta_x);
	if (crop_from_start) {
	    track.changeSegmentTimes(segment_index, delta_t_aud, 0);
	} else {
	    track.changeSegmentTimes(segment_index, 0, delta_t_aud);
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.cropping.stop, endCrop);
	    
	
    // Segment Selecting
    var orig_x, orig_id, last_id, last_x, last_dir;

    var initSelection = function(e) {
	orig_x = e.x;
	last_x = e.x;
	orig_id = e.segment_id;
	last_id = e.segment_id;
	if (e.segment_id != null) {
	    selection.add(e.segment_id);
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.selecting.start,
			     initSelection);

    //TODO: selection behavior could be more intutive in some cases, and
    //    could use better gui visualization (change cursor, show rect maybe?)
    var updateSelection = function(e) {
	var segment_ids = []
	// Just entered a segment (except for orig seg, which stays selected)
	if (e.segment_id != null && e.segment_id != last_id &&
	    e.segment_id != orig_id) {
	    segment_ids.push(e.segment_id);
	}
	// Just exited a segment (except for the original segment)
	if (last_id != null && last_id != e.segment_id && last_id != orig_id) {
	    segment_ids.push(last_id);
	}

	// Check if the direction implies selection or deselection
	if (Math.sign(e.x - last_x) == Math.sign(e.x - orig_x)) {
	    for (var i = 0; i < segment_ids.length; i++) {
		var segment_id = segment_ids[i];
		if (!selection.has(segment_id)) {
		    selection.add(segment_id);
		}
	    }
	} else {
	    for (var i = 0; i < segment_ids.length; i++) {
		var segment_id = segment_ids[i];
		if (selection.has(segment_id)) {
		    selection.remove(segment_id);
		}
	    }	    
	}
		
	last_id = e.segment_id;
	last_x = e.x;
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.selecting.update,
			     updateSelection);
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.selecting.stop,
			     updateSelection);

    var clearSelection = function(e) {
	selection.clear();
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.clear_select, clearSelection);


    // Initialize the view
    var view = TrackView(track, parent_id, lecture.timeline);
    track.timeline.addEventListener(view.draw);
};
