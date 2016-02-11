"use strict";
// Lecture model object
// Contains the models for the visuals, audio, and retimer
var LectureModel = function() {
    var self = {};
    
    //TODO: stuff that's currently in lecture view should action be in
    // visuals view?
    
    //TODO: should these be accessors? Esp. so undo manager can tell they've
    // been changed with loadFromJSON?
    self.timer = Timer();
    self.timeline = Timeline(self);
    self.visuals = new VisualsModel(self);
    self.renderer = Renderer(self);
    self.retimer = new RetimerModel(self);
    ThumbnailsModel(self);
    self.audio = new AudioModel(self);
    self.is_recording = Accessor(false);
    
    LectureController(self);
    
    //TODO: What if there are multiple open lectures in the future?
    //  Should have specific instance of TimeManager, rather than
    //  changing the entire class/prototype
    TimeManager.getVisualManager().clear();
    TimeManager.getAudioManager().clear();
    
    // Get the duration of the lecture in milliseconds, which is the max
    // duration of the audio and slides
    self.getDuration = function() {
	var audio_duration = self.audio.getDuration();
	var visual_duration = self.visuals.getDuration();
	// Change the visual_duration into audio time
	visual_duration = self.retimer.getAudioTime(visual_duration);
        return Math.max(audio_duration, visual_duration);
    };

    // Saving the model to JSON
    self.saveToJSON = function() {
        return {
            visuals: self.visuals.saveToJSON(),
	    visuals: self.visuals.saveToJSON(),
	    audio: self.audio.saveToJSON(),
	    retimer: self.retimer.saveToJSON()
        };
    };

    self.loadFromJSON = function(json_object) {
	self.visuals = VisualsModel.loadFromJSON(json_object.visuals);
	self.audio = AudioModel.loadFromJSON(json_object.audio);
	self.retimer = RetimerModel.loadFromJSON(json_object.retimer);
    };
};
