"use strict";
var RecordingView = function() {

    // Initiallize recording controls

    var $toggle_recording = $("<div>")
	.attr("id", RecordingView.IDS.toggle_recording)
	.attr("class", RecordingView.CLASSES.start);

    var $record_visuals = $("<input>")
	.attr("id", RecordingView.IDS.record_visuals)
	.attr("type", "checkbox")
	.prop("checked", true);
    var $record_visuals_wrapper = $("<label>")
	.attr("class", RecordingView.CLASSES.ui_label)
	.append($record_visuals)
	.append("Visuals");

    var $record_audio = $("<input>")
	.attr("id", RecordingView.IDS.record_audio)
	.attr("type", "checkbox")
	.prop("checked", true);
    var $record_audio_wrapper = $("<label>")
	.attr("class", RecordingView.CLASSES.ui_label)
	.append($record_audio)
	.append("Audio");
        
    var $controls = $("<div>")
	.attr("id", RecordingView.IDS.controls)
	.append($toggle_recording)
	.append($record_visuals_wrapper)
	.append("</br>")
	.append($record_audio_wrapper);

    $("#lectureToolsContainer").append($controls); //TODO: don't hardcode

    // Dynamic stuff
    
    var self = {};

    // recording - boolean that specifies if we're recording
    self.update = function(recording) {
	var new_class = recording ? RecordingView.CLASSES.stop :
	    RecordingView.CLASSES.start;
	$toggle_recording.attr("class", new_class);
    };

    return self;
};

RecordingView.IDS = {
    toggle_recording: "toggle-recording",
    record_audio: "audio-checkbox",
    record_visuals: "visuals-checkbox",
    controls: "recording-controls"
};
RecordingView.CLASSES = {
    start: "start",
    stop: "stop",
    ui_label: "ui-label"
};
