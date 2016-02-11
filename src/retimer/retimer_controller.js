"use strict";
var RetimerController = function(lecture, retimer) {
    var view = RetimerView(lecture, retimer);
    var evt_mgr = RetimerEventManager();
    var EVENTS = evt_mgr.EVENT_TYPES

    // User-initiated actions
    
    var addConstraint = function(e) {
	var audio_time = lecture.timeline.pixelsToAudioTime(e.x);
        var visual_time = retimer.getVisualTime(audio_time);
	retimer.addConstraint(visual_time, audio_time);	
    };    
    evt_mgr.addEventListener(EVENTS.add_constraint, addConstraint);

    var deleteConstraints = function(e) {
	retimer.deleteConstraint();
    };
    evt_mgr.addEventListener(EVENTS.delete_constraints, deleteConstraints);

    var selection_start;
    var startSelection = function(e) {
	selection_start = e.x;
	retimer.selection.update(selection_start, selection_start);
    };
    evt_mgr.addEventListener(EVENTS.start_selection, startSelection);

    var updateSelection = function(e) {
	retimer.selection.update(selection_start, e.x);
    };
    evt_mgr.addEventListener(EVENTS.update_selection, updateSelection);

    var clearSelection = function(e) {
	retimer.selection.update(0, 0);
    };
    evt_mgr.addEventListener(EVENTS.clear_selection, clearSelection);
    

    // Automatic things

    retimer.addEventListener(view.draw);
    retimer.selection.end_x.addEventListener(view.drawSelection);
};
