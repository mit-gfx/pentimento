"use strict";
var AudioModel = function(lecture) {
    var self = this;

    self.getID = StaticGetter("audio-tracks");

    // Start with one track
    self.tracks = Accessor([AudioTrack(self.getID(), lecture)]);
    self.active_track_index = Accessor(0);
    self.recorder = null;

    self.active_track_index.setValidation(function(new_val) {
	return new_val >= 0 && new_val < self.tracks.getLength();
    });

    // Recorder setup, should happen only after the document is ready
    navigator.getUserMedia(
	{video: false, audio: true},
	function(mediaStream) {
	    self.recorder = RecordRTC(mediaStream, {autoWriteToDisk: true});
	    AudioController(self, lecture);
	},
	function(err) {
	    console.error("The following error occured: " + err);
	}
    );

    // Create a new track and add it to self.tracks
    // insert_index is optional, default adds the track to the end.
    self.addTrack = function(insert_index) {
	var track = AudioTrack(self.getID(), lecture);
	if (insert_index != null) {
	    self.tracks.insert(track, insert_index);
	} else {
	    self.tracks.push(track);
	}
    };

    // Remove the specified audio track, or the active track if null
    self.removeTrack = function(track) {
	// Make sure there will be at least one track remaining
	if (self.tracks.getLength() < 2) {
	    throw Error("Can't remove track, it's the last one!");
	}

	var removed;
	if (track == null) {
	    removed = self.tracks.removeIndex(self.active_track_index.get());
	} else {
	    removed = self.tracks.removeValue(track);
	}

	if (removed) {
	    self.active_track_index.set(0);
	    return true;
	}
	
	return false;
    };

    // Get the total duration of the audio, which is the max of all the
    // track lengths, in milliseconds
    self.getDuration = function() {
        var duration = 0;
	var tracks_iter = self.tracks.iterator();
	while (tracks_iter.hasNext()) {
	    duration = Math.max(duration, tracks_iter.next().getDuration());
	}
        return duration;
    };

    self.startRecording = function() {
	self.recorder.startRecording();
    };

    self.stopRecording = function(e) {
	self.recorder.stopRecording(function(audioURL) {
	    var duration = e.end_time - e.start_time;
	    var track = self.tracks.valueAt(self.active_track_index.get());
	    // TODO: maybe the segment creation should be done inside the track
            var segment = AudioSegment(audioURL, duration, 0, duration,
					   lecture, track.getID());
	    track.insertSegment(segment, e.start_time);
        });
    };

    self.startPlayback = function(e) {
	var tracks_iter = self.tracks.iterator();
	while (tracks_iter.hasNext()) {
	    tracks_iter.next().startPlayback(e.t_audio);
	}
    };

    self.stopPlayback = function(e) {
	var tracks_iter = self.tracks.iterator();
	while (tracks_iter.hasNext()) {
	    tracks_iter.next().stopPlayback();
	}
    };

    // Get an array of all the unique audio blob URLs
    self.getBlobURLs = function() {
        var unique_urls = [];
	
	var track_iter = self.tracks.iterator();
	while (track_iter.hasNext()) {
	    var seg_iter = track_iter.next().segments.iterator();
	    while (seg_iter.hasNext()) {
		var url = seg_iter.next().getAudioURL();
		if (unique_urls.indexOf(url) < 0) {
		    unique_urls.push(url);
		}
	    }
	}
	return unique_urls;
    };

    // Saving the model to JSON.
    // Returns a JSON string
    self.saveToJSON = function() {
        var json_object = {
            tracks: []
        };

        // Get the audio URLS so that the segments' audio clip URL can be 
        // replaced with an index number instead. This index number will be
	// used as the filename base.
        var audio_blob_urls = self.getBlobURLs();

        // Add each track to the json_object
	var track_iter = self.tracks.iterator();
	while (track_iter.hasNext()) {
	    var json_track = track_iter.next().saveToJSON();
	    json_object.tracks.push(json_track);

            // Also, process the segments in the track so that the
            // audio clip is the index of the URL in the getBlobURLs() array.
	    // TODO: is there a better way to do this? Seems like this is
	    //     something the segment's saveToJSON should be doing itself.
	    //     loadFromJSON doesn't even change the indices back to urls.
	    //     Maybe there should be a AudioResource manager that stores
	    //     unique urls and segments just use ids for them from the get
	    //     go?
            var json_segments = json_track.segments;
            for (var i = 0; i < json_segments.length; i++) {
                var url_index = audio_blob_urls.indexOf(json_segments[i]
							.getAudioURL());
                if (url_index < 0) {
                    console.error('audio clip URL not found in array');
                };
                json_segments[i].audio_url = url_index;
            };
        };

        return json_object;
    };
};
// Loading the model from JSON
AudioModel.loadFromJSON = function(json_object) {

    var audio_model = new AudioModel();

    // The JSON object is an array containing the JSON track objects.
    // Get the track object from JSON and add it to the array of tracks.
    var json_tracks = json_object.tracks;
    var loaded_tracks = [];
    for (var i = 0; i < json_tracks.length; i++) {
        var track = AudioTrack.loadFromJSON(json_tracks[i])
        audio_tracks.push(track);
    };
    audio_model.tracks.set(audio_tracks);

    return audio_model;
};
