"use strict";
var Timeline = function(lecture) {
    var self = {};

    var MIN_PX_PER_MS = 4/1000;
    var MAX_PX_PER_MS = 150/1000;
    var MIN_LENGTH = 100*1000;

    self.length = Accessor(0);
    self.px_per_ms = Accessor(40/1000);

    self.length.default_set = self.length.set;
    self.length.set = function(new_length) {
	self.length.default_set(Math.max(new_length, MIN_LENGTH));
    };
    
    self.px_per_ms.setValidation(function(new_scale) {
	return (new_scale > MIN_PX_PER_MS && new_scale < MAX_PX_PER_MS);
    });

    self.pixelsToAudioTime = function(pixels) {
	return Math.round(pixels/self.px_per_ms.get());
    };

    self.audioTimeToPixels = function(audio_time) {
	return Math.round(audio_time*self.px_per_ms.get());
    };

    TimelineController(self, lecture);
    
    return self;
};
