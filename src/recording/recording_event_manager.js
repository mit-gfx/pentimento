"use strict";
var RecordingEventManager = function() {
    var self = EventManager().initializeEvents({
	start_recording: "start_recording",
	stop_recording: "stop_recording",
	change_content_type: "change_content_type"
    });

    var record_visuals_elem = $("#" + RecordingView.IDS.record_visuals)[0];
    var record_audio_elem = $("#" + RecordingView.IDS.record_audio)[0];

    var clickHandler = function(e) {
	var event_type;
	var event_args = {};
	switch ($(e.target).attr("id")) {
	case RecordingView.IDS.toggle_recording:
	    if ($(e.target).attr("class") == RecordingView.CLASSES.start) {
		event_type = self.EVENT_TYPES.start_recording;
	    } else {
		event_type = self.EVENT_TYPES.stop_recording;
	    }
	    break;
	case RecordingView.IDS.record_audio:
	case RecordingView.IDS.record_visuals:
	    event_type = self.EVENT_TYPES.change_content_type;
	    event_args.visuals = record_visuals_elem.checked;
	    event_args.audio = record_audio_elem.checked;
	    break;
	default:
	    break;
	}

	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}
    };
    $("#" + RecordingView.IDS.controls).click(clickHandler);
    
    return self;
};
