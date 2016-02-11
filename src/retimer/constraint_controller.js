var ConstraintController = function(constraint, lecture) {
    var retimer = lecture.retimer;
    var view = ConstraintView(constraint, lecture);
    var evt_mgr = ConstraintEventManager(constraint.getID());

    //// Constraint Dragging

    var last_x, drag_audio, orig_x;
    
    var initDrag = function(e) {
	last_x = e.x;
	orig_x = e.x;
	drag_audio = e.drag_audio;
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.start_drag, initDrag);

    var drag = function(e) {
	var t_aud = lecture.timeline.pixelsToAudioTime(e.x);
	if (drag_audio) {
	    if (retimer.canUpdateConstraint(constraint, {t_audio: t_aud})) {
		last_x = e.x;
	    }
	    view.drawAt(last_x, orig_x);
	} else {
	    var t_vis = retimer.getVisualTime(t_aud);
	    if (retimer.canUpdateConstraint(constraint, {t_visual: t_vis})) {
		last_x = e.x;
	    }
	    view.drawAt(orig_x, last_x);
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.update_drag, drag);

    var end_drag = function(e) {
	drag(e);
	
	var t_aud = lecture.timeline.pixelsToAudioTime(e.x);
	if (drag_audio) {
	    retimer.updateConstraint(constraint, {t_audio: t_aud});
	} else {
	    var t_vis = retimer.getVisualTime(t_aud);
	    retimer.updateConstraint(constraint, {t_visual: t_vis});
	}
    };
    evt_mgr.addEventListener(evt_mgr.EVENT_TYPES.end_drag, end_drag);

    // Automatic redraws
    //TODO: if the timeline zooms, will the constraints be redrawn at the
    // new positions?
    retimer.addEventListener(view.draw);
    constraint.addEventListener(view.draw);
    
};
