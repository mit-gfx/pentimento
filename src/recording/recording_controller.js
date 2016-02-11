//TODO: This controller is kinda an event manager, but it depends on an event
//    manager. Hmmm... This might make sense. But is there a better way?
"use strict";
var RecordingController = function(lecture) {
    var timer = lecture.timer;

    var view = RecordingView();
    var evt_mgr = RecordingEventManager();
    var EVENTS = evt_mgr.EVENT_TYPES;

    var visualTM = TimeManager.getVisualManager();
    var audioTM = TimeManager.getAudioManager();
    
    var recording = false;
    var record_visuals = true;
    var record_audio = true;

    var changeContentType = function(e) {
	record_visuals = e.visuals;
	record_audio = e.audio;
    };
    evt_mgr.addEventListener(EVENTS.change_content_type, changeContentType);
    

    var self = EventManager().initializeEvents({
	start: "start",
	start_audio: "start_audio",
	start_visual: "start_visual",
	stop: "stop",
	stop_audio: "stop_audio",
	stop_visual: "stop_visual"
    });

    // Returns true if a recording is in progress
    self.isRecording = function() {
        return recording;
    };

    // Start recording and notify other controllers
    // Returns true if it succeeds
    var startRecording = function() {

        // Start the timing and exit if it fails
        if (!timer.startTiming()) {
            return false;
        };

        recording = true;	
        undoManager.startHierarchy("recording");

        var begin_time = timer.getBeginTime(); //TODO: any reason why we need getBegin/EndTime instead of just returning a time from start/endTiming?

        if (record_visuals) {
	    //TODO: should this be a listener?
	    //also TODO: doesn't work very well when inserting in the middle of
	    // prexisting stuff
//            visualTM.prepareShift(begin_time);
	    self.fireEvent(self.EVENT_TYPES.start_visual,
			   {start_time: begin_time});
        };

        if (record_audio) {
	    //TODO (maybe should be listener)
	    //disableEditUI(); // from audio_controller
	    self.fireEvent(self.EVENT_TYPES.start_audio,
			   {start_time: begin_time});
	    // TODO: Add an indicator in the selected track to show the duration of the recording
        };

	self.fireEvent(self.EVENT_TYPES.start, {start_time: begin_time});

	//TODO: should this be in the if(record_audio) block?
	//TODO: should these also be listeners?
        audioTM.prepareShift(begin_time);
	//TODO
	//updateButtons(); // from lecture_controller
        return true;
    };
    evt_mgr.addEventListener(EVENTS.start_recording, startRecording);

    // Stop recording and notify other controllers
    // Returns true if it succeeds
    var stopRecording = function() {

        if (!recording || !timer.stopTiming()) {
            return false;
        };

        recording = false;

	var begin_time = timer.getBeginTime();
        var end_time = timer.getEndTime();
        var record_duration = end_time - begin_time;

        if (record_visuals) {	    
            visualTM.completeShift(record_duration);
	    self.fireEvent(self.EVENT_TYPES.stop_visual,
			   {start_time: begin_time, end_time: end_time});
        };

        if (record_audio) {	    
	    //TODO
	    //enableEditUI(); // from audio_controller
	    self.fireEvent(self.EVENT_TYPES.stop_audio,
			   {start_time: begin_time, end_time: end_time});
        };

	self.fireEvent(self.EVENT_TYPES.stop,
		       {start_time: begin_time, end_time: end_time});
        audioTM.completeShift(record_duration);
        undoManager.endHierarchy("recording");

        // TODO
	//updateButtons(); // from lecture_controller

        return true;
    };
    evt_mgr.addEventListener(EVENTS.stop_recording, stopRecording);
  

    evt_mgr.addEventListener(EVENTS.start_recording, function(e) {
	view.update(true);
    });
    evt_mgr.addEventListener(EVENTS.stop_recording, function(e) {
	view.update(false);
    });


    return self;
}
