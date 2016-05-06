"use strict";
//TODO: maybe consolidate some of these params into an object
var AudioSegment = function(audio_url, audio_length, start_time0,
			    end_time0, lecture, parent_id) {
    var self = {};

    self.getID = StaticGetter("segment" + AudioSegment.counter.get());
    AudioSegment.counter.increment(1);

    self.getWavesurfer = StaticGetter(Object.create(WaveSurfer));
    self.getAudioURL = StaticGetter(audio_url);
    self.getOriginalLength = StaticGetter(audio_length);

    // Specifies what part of the audio clip the segment refers to
    self.start_time = Accessor(start_time0);
    self.end_time = Accessor(end_time0);
    
    AudioSegmentController(self, parent_id, lecture);
        
    self.getDuration = function() {
	return self.end_time.get() - self.start_time.get();
    };

    // Subscribe the callback for only the next firing of the "finish" event.
    var current_callback;
    var subscribeToNextFinish = function(callback) {
	var wavesurfer = self.getWavesurfer();
	current_callback = function() {
	    callback();
	    wavesurfer.un("finish", current_callback);
	};
	wavesurfer.on("finish", current_callback);
    };
    
    self.startPlayback = function(callback, clip_start_time) {
	if (clip_start_time == null) {
	    clip_start_time = self.start_time.get();
	}
	subscribeToNextFinish(callback);
	var wavesurfer = self.getWavesurfer();
	wavesurfer.play(clip_start_time/1000, self.end_time.get()/1000);
    };

    self.stopPlayback = function() {
	var wavesurfer = self.getWavesurfer();
	wavesurfer.un("finish", current_callback);
	wavesurfer.stop();
    };

    // t is time from the current start_time
    self.split = function(t) {
	var middle_t = self.start_time.get() + t;
	var remainder = AudioSegment(audio_url, audio_length, middle_t,
					 self.end_time.get(), lecture,
					 parent_id);
	self.end_time.set(middle_t);
	return remainder;
    };
					 

    self.canChangeClipTimes = function(delta_start, delta_end) {
	var new_start = self.start_time.get() + delta_start;
	var new_end = self.end_time.get() + delta_end;
	if (new_start < 0 || new_end > audio_length || new_end <= new_start) {
	    return false;
	}
	return true;
    };

    self.changeClipTimes = function(delta_start, delta_end) {
	if (!self.canChangeClipTimes(delta_start, delta_end)) {
	    return false;
	}
	self.start_time.increment(delta_start);
	self.end_time.increment(delta_end);
	return true;
    };
    
    self.saveToJSON = function() {
        var json_object = {
            audio_url: audio_url,
	    audio_length: audio_length,
            start_time: self.start_time.get(),
            end_time: self.end_time.get()
        };

        return json_object;
    };

    return self;
};

AudioSegment.loadFromJSON = function(json_object) {
    return AudioSegment(json_object.audio_url, json_object.audio_length,
			    json_object.start_time, json_object.end_time);
};
AudioSegment.counter = Accessor(0);
