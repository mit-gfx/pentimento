"use strict";
var RetimerModel = function(lecture) {
    var self = {};
    self.selection = RetimerSelection(self, lecture);       
    
    var constraints = Accessor([]);
    self.getConstraintsIterator = constraints.iterator;
    self.constraintByIndex = constraints.valueAt;
    self.addEventListener = constraints.addEventListener;

    RetimerController(lecture, self);
    
    self.constraintIndexByTAudio = function(t_audio) {
	var index = 0;
	var iter = constraints.iterator();
	while (iter.hasNext()) {
	    var constraint = iter.next();
	    if (constraint.t_audio.get() >= t_audio) {
		break;
	    }
	    index++;
	}
	return index;
    };

    
    // Check to see if the constraint is in a valid position
    // excluded_constraint is a constraint that we won't check against. This is
    // for use during testing, where we might not want to check a test
    // constraint against the constraint it is based off of. 
    self.checkConstraint = function(constraint, excluded_constraint) {
	var iter = constraints.iterator();
	while (iter.hasNext()) {	    
	    var other = iter.next(); 
            if (other === constraint || other === excluded_constraint) {
                continue;
            } else if (constraint.overlaps(other)) {
		return false;
	    }	   
	};	
	return true;
    };

    self.canUpdateConstraint = function(constraint, props) {
	var test = constraint.copy();
	test.set(props);
	return self.checkConstraint(test, constraint);
    };

    self.updateConstraint= function(constraint, props) {
	if (constraints.indexOf(constraint) < 0) {
            throw Error("Constraint not found.");
        } else if (self.canUpdateConstraint(constraint, props)) {
	    constraint.set(props);
	    return true;
	}
	return false;
    };

    self.addConstraint = function(visual_time, audio_time, auto) {
	var constraint = Constraint(visual_time, audio_time, auto, lecture);
	if (!self.checkConstraint(constraint)) {
            return false; 
        }	
	var index = self.constraintIndexByTAudio(audio_time);
	if (constraints.insert(constraint, index)) {
	    // registering has to happen before adding events
	    constraint.register();
	    constraint.addEventListener(constraints.triggerEvent);
	    return true;
	}	
	return false;
    };

    // Deletes selected constraints if constraint is null
    self.deleteConstraint = function(constraint) {
	if (constraint != null) {
	    if (constraints.removeValue(constraint)) {
		constraint.removeEventListener(constraints.triggerEvent);
		constraint.unregister();
		return true;
	    }
	    return false;
	}

	var success = true;
	var iter = self.selection.constraints.iterator();
	while (iter.hasNext()) {
	    success = (success && self.deleteConstraint(iter.next()));
	}
	return success;
    };

    // Delete any redundant constraints
    // auto - true if pruning automatically added constraints, false if pruning
    //    manually added constraints
    self.pruneConstraints = function(auto) {
        var constraints_to_prune = [];
	var iter = constraints.iterator();
	var previous = iter.next();
	var current = iter.next();
	while (iter.hasNext()) {	    
            var next = iter.next();
            if (current.auto.get() == auto) {
		var previous_ratio = current.calcVisualAudioRatio(previous);
		var next_ratio = current.calcVisualAudioRatio(next);
                if (Math.abs(next_ratio - previous_ratio) < 0.0001) {
                    constraints_to_prune.push(current);
                }
            }	    
            previous = current;
	    current = next;
        }
	
        for (var i = 0; i < constraints_to_prune.length; i++) {
            self.deleteConstraint(constraints_to_prune[i]);
        }
    };

    self.addAutoConstraints = function(e) {
	var start_t_vis = self.getVisualTime(e.start_time);
	self.addConstraint(start_t_vis, e.start_time, true);

	var end_t_vis = self.getVisualTime(e.end_time);
	self.addConstraint(end_t_vis, e.end_time, true);

	self.pruneConstraints(true);
    };

    // is_audio_t - boolean specifying if time is in audio time instead of
    //     visual time
    var getBoundingConstraints = function(time, is_audio_t) {
	var t_type = is_audio_t ? "t_audio" : "t_visual";
	var index = -1;
	var iter = constraints.iterator();
	while (iter.hasNext()) {
	    var constraint = iter.next();
	    if (constraint[t_type].get() >= time) {
		break;
	    }
	    
	    index++;
	}
	var previous = constraints.valueAt(index);
	var next_index = previous ? index + 1 : -1;
	return {previous: previous,
		next: constraints.valueAt(next_index)};
    };

    // Convert audio to visual time
    self.getVisualTime = function(audio_time) {
	var bounding_constraints = getBoundingConstraints(audio_time, true);
	var prev = bounding_constraints.previous;
	var next = bounding_constraints.next;
	if (prev == undefined || next == undefined) { 
            return audio_time; 
        }
	var vis_aud_ratio = next.calcVisualAudioRatio(prev);
	var aud_diff = audio_time - prev.t_audio.get();
	return vis_aud_ratio*aud_diff + prev.t_visual.get();
    };

    // Convert visual to audio time
    self.getAudioTime = function(visual_time) {
	var bounding_constraints = getBoundingConstraints(visual_time, false);
	var prev = bounding_constraints.previous;
	var next = bounding_constraints.next;
	if (prev == undefined || next == undefined) { 
            return visual_time; 
        }
	var vis_aud_ratio = next.calcVisualAudioRatio(prev);
	var vis_diff = visual_time - prev.t_visual.get();
	return (vis_diff/vis_aud_ratio) + prev.t_audio.get();
    };
    
    // Saving the model to JSON
    // Returns the JSON object.
    self.saveToJSON = function() {
	return {constraints: saveArrayJSON(constraints)};
    };

    return self;
};

RetimerModel.loadFromJSON = function(json_object) { 

    var retimer_model = RetimerModel();

    var json_constraints = json_object['constraints'];
    var loaded_constraints = [];
    for (var i = 0; i < json_constraints.length; i++) {
	constraints.push(Constraint.loadFromJSON(json_constraints[i]));
    };      

    retimer_model.constraints.set(loaded_constraints);
    
    return retimer_model;
}; 
