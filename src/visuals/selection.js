"use strict";
var VisualsSelection = function(visuals, lecture) {
    var self = {};    
    self.visuals = Accessor([]);
    self.top = Accessor(0);
    self.bottom = Accessor(0);
    self.left = Accessor(0);
    self.right = Accessor(0);
    var selected_at_vis_t;

    self.addEventListener = function(callback) {
	self.right.addEventListener(callback);
    };

    self.update = function(start_coord, end_coord, vis_t) {
	// deselect the old selection
	var old_iter = self.visuals.iterator();
	while (old_iter.hasNext()) {
	    old_iter.next().selected.set(false);
	}

	// Figure out what the edges are
	var top, right, bottom, left;
	if (start_coord.x > end_coord.x) {
	    left = end_coord.x;
	    right = start_coord.x;
	} else {
	    left = start_coord.x;
	    right = end_coord.x;
	}
	if (start_coord.y > end_coord.y) {
	    top = end_coord.y;
	    bottom = start_coord.y;
	} else {
	    top = start_coord.y;
	    bottom = end_coord.y;
	}

	var new_selection = [];	
	var aud_t = lecture.timer.current_time.get()
	var vis_t = lecture.retimer.getVisualTime(aud_t);
	var slide = visuals.getSlideAtVisT(vis_t);
	
	var iter = slide.visuals.iterator();
	while (iter.hasNext()) {
	    var visual = iter.next();
	    if (visual.isWithinBox(vis_t, top, right, bottom, left)) {
		visual.selected.set(true);
		new_selection.push(visual);
	    }
	}

	self.visuals.set(new_selection);
	
	self.top.set(top);
	self.bottom.set(bottom);
	self.left.set(left);
	self.right.set(right);

	selected_at_vis_t = vis_t;
    };   

    // t_del should be null to completely remove the visuals from the lecture
    self.deleteVisuals = function(vis_t_del) {
	if (vis_t_del == null) {
	    var slide = visuals.getSlideAtVisT(selected_at_vis_t);
	    var iter = self.visuals.iterator();
	    while (iter.hasNext()) {
		slide.visuals.removeValue(iter.next());
	    }
	} else {
	    var iter = self.visuals.iterator();
	    while (iter.hasNext()) {
		iter.next().t_del.set(vis_t_del);
	    }
	}
	self.clear();
	//TODO: make sure things get redrawn properly (i.e. deleted visuals are gone)
    };

    
    self.translate = function(dx, dy, vis_t) {
	var translation_matrix = [[1, 0, dx], [0, 1, dy], [0, 0, 1]];
	var iter = self.visuals.iterator();
	while (iter.hasNext()) {
	    iter.next().applySpatialTransform(translation_matrix, vis_t);
	}
	self.top.increment(dy);
	self.bottom.increment(dy);
	self.left.increment(dx);
	self.right.increment(dx);
    };	
	

    self.applySpatialTransform = function(matrix, t, consolidate) {	
	var iter = self.visuals.iterator();
	while (iter.hasNext()) {
	    iter.next().applySpatialTransform(matrix, t, consolidate);
	}
	// TODO: make sure things get redrawn
    };
    
    self.applyPropertyTransform = function(prop_name, val, t) {
	var visuals_iter = self.visuals.iterator();
	while (visuals_iter.hasNext()) {
	    visuals_iter.next().applyPropertyTransform(prop_name, val, t);	    
	}
	//TODO: redraw
    };

    self.isEmpty = function() {
	return self.selection.get().length == 0;
    };

    //TODO: this still needs to attached to something
    self.clear = function() {
	self.visuals.set([]);
	self.top.set(0);
	self.bottom.set(0);
	self.left.set(0);
	self.right.set(0);
    };


    return self;
};
