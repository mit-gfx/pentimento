var RetimerSelection = function(retimer, lecture) {
    var self = {};
    
    self.constraints = Accessor([]);
    self.start_x = Accessor(0);
    self.end_x = Accessor(0);

    self.update = function(x1, x2) {
	// Deselect the old selection
	var old_iter = self.constraints.iterator();
	while (old_iter.hasNext()) {
	    old_iter.next().selected.set(false);
	}

	// Define start to be the min of x1, x2 and end to be the max.
	var start, end;
	if (x1 > x2) {
	    start = x2;
	    end = x1;
	} else {
	    start = x1;
	    end = x2;
	}	

	// Get the indicies of the bounding constraints
	var start_t = lecture.timeline.pixelsToAudioTime(start);
	var start_i = retimer.constraintIndexByTAudio(start_t);
	var end_t = lecture.timeline.pixelsToAudioTime(end);
	var end_i = retimer.constraintIndexByTAudio(end_t);

	// Select each constraint within the index range
	var new_selection = [];
	for (var i = start_i; i < end_i; i++) {
	    var constraint = retimer.constraintByIndex(i);
	    constraint.selected.set(true);
	    new_selection.push(constraint);
	}
	self.constraints.set(new_selection);

	// Set the pixel selection bounds
	self.start_x.set(start);
	self.end_x.set(end);
    };

    return self;
};
