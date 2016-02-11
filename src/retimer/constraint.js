"use strict";
var Constraint = function(tvis, taud, auto, lecture, copy) {
    var self = {};    
    var MIN_GAP = 10; // Min distance between constraints, in milliseconds
    
    var id = "constraint" + Constraint.counter.get();
    Constraint.counter.increment(1);
    self.getID = function() { return id; };
    
    self.t_visual = Accessor(tvis);
    self.t_audio= Accessor(taud);
    self.auto = Accessor(Boolean(auto));   
    self.selected = Accessor(false);    
    
    self.set = function(props) {
	for (var key in props) {
	    if (key in self && self[key].set && props[key] != null) {
		self[key].set(props[key]);
	    }
	}
    };
    
    var registered = Accessor(false);
    self.isRegistered = function() { return registered.get(); };    

    self.register = function() {
	self.t_visual = TimeManager.getVisualManager()
	    .createInstance(self.t_visual.get());
	self.t_audio = TimeManager.getAudioManager()
	    .createInstance(self.t_audio.get());
	registered.set(true);	
    };
    
    self.unregister = function() {
	self.t_visual.destruct();
	self.t_audio.destruct();
	registered.set(false);
    };

    self.addEventListener = function(callback) {
	self.t_visual.addEventListener(callback);
	self.t_audio.addEventListener(callback);
	self.auto.addEventListener(callback);
	self.selected.addEventListener(callback);
	registered.addEventListener(callback);
    };

    self.removeEventListener = function(callback) {
	self.t_visual.removeEventListener(callback);
	self.t_audio.removeEventListener(callback);
	self.auto.removeEventListener(callback);
	self.selected.removeEventListener(callback);
	registered.removeEventListener(callback);
    };

    self.triggerEvent = function() {
	self.t_audio.triggerEvent();
    };    

    // returns true if self overlaps or is too close to other_constraint
    self.overlaps = function(other_constraint) {
	var visual_gap = self.t_visual.get() - other_constraint.t_visual.get();
	var audio_gap = self.t_audio.get() - other_constraint.t_audio.get();

	if (Math.abs(visual_gap) < MIN_GAP || Math.abs(audio_gap) < MIN_GAP ||
	    Math.sign(visual_gap) !== Math.sign(audio_gap)) {
	    return true;
	}
	return false;
    };

    self.copy = function() {
	var copy = Constraint(self.t_visual.get(), self.t_audio.get(),
				  self.auto.get(), null, true);
	return copy;
    };

    self.calcVisualAudioRatio = function(constraint) {
	var delta_visual = constraint.t_visual.get() - self.t_visual.get();
	var delta_audio = constraint.t_audio.get() - self.t_audio.get();
	return delta_visual/delta_audio;
    };

    self.saveToJSON = function() {
	return {
	    t_vis: self.t_visual.get(),
	    t_aud: self.t_audio.get(),
	    auto: self.auto.get(),
	};
    };

    // Copies are for value testing only, they don't need controllers or views
    if (!copy) {
	ConstraintController(self, lecture);
    };
    
    return self;
};

Constraint.loadFromJSON = function(json_object) {
    var constraint = Constraint(json_object.t_vis, json_object.t_aud,
				json_object.auto);
    return constraint;
};

Constraint.counter = Accessor(0);
