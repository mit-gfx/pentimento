var PlaybackController = function(lecture) {    
    var self = EventManager().initializeEvents({
	start: "start",
	stop: "stop"
    });

    var view = PlaybackView(self);
    var timer = lecture.timer;
    var is_playing = false;
    var auto_stop_timeout = null;
    var $playback = $("#" + PlaybackView.IDS.control);

    self.startPlayback = function(end_time) {
	if (is_playing || !timer.startTiming()) {
            return false;
        };

	is_playing = true;
	self.fireEvent("start", {t_audio: timer.current_time.get()});

        var start_time = timer.getBeginTime();
	
	if (end_time == null) {
	    end_time = lecture.getDuration();
	}

	//TODO: this isn't really necessary if the end_time is just the end
	// of the lecture, which it currently is in all cases. For what
	// circumstances do we want the option to set the end_time of the
	// playback?
	auto_stop_timeout = setTimeout(self.stopPlayback,
				       end_time - start_time);

	//TODO
	//disableEditUI(); // from audio_controller
	view.startPlayback();
	
	return true;
    };

    self.stopPlayback = function() {
	// Stop the timing and exit if it fails
        if (!is_playing || !timer.stopTiming()) {
            return false;
        };

	clearTimeout(auto_stop_timeout);
	is_playing = false;
	self.fireEvent("stop", {t_audio: timer.current_time.get()});

	//TODO
	//enableEditUI(); // from audio_controller
	view.stopPlayback();

        return true;
    };

    $playback.click(function() {
	if ($playback.hasClass(PlaybackView.CLASSES.in_progress)) {
	    self.stopPlayback();
	} else {
	    self.startPlayback();
	}
    });
    
    return self;
};
