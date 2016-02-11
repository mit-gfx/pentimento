"use strict";
var LectureController = function(lecture) {
    var self = {};
    var view = LectureView();

    //// VIEW CHANGES   

    //TODO: also need to redraw visuals when un/redoing
    $("#" + LectureView.IDS.undo).click(undoManager.undoLastHierarchy);
    $("#" + LectureView.IDS.redo).click(undoManager.redoLastHierarchy);
    $("#" + LectureView.IDS.help_button).click(view.showHelpDialog);

    var updateUndoButtons = function() {
	// canUndo and canRedo return strings if we can undo/redo, but an empty
	// string is falsy, so convert to the desired boolean using !== false.
	view.updateUndoButtons(undoManager.canUndo() !== false,
			       undoManager.canRedo() !== false);
    };
    undoManager.addListener('actionDone', updateUndoButtons);
    undoManager.addListener('operationDone', updateUndoButtons);	
    updateUndoButtons(); // Initial update

    //// PLAYBACK EVENT LISTENERS
    
    var playbackController = PlaybackController(lecture);
    playbackController.addEventListener(playbackController.EVENT_TYPES.start,
					lecture.audio.startPlayback);
    playbackController.addEventListener(playbackController.EVENT_TYPES.stop,
					lecture.audio.stopPlayback);

    //// RECORDING EVENT LISTENERS
    
    var recordingController = RecordingController(lecture);
    
    recordingController.addEventListener(
	recordingController.EVENT_TYPES.start,
	function() { lecture.is_recording.set(true); }
    );
    recordingController.addEventListener(
	recordingController.EVENT_TYPES.stop,
	function() { lecture.is_recording.set(false); }
    );

    recordingController.addEventListener(
	recordingController.EVENT_TYPES.start_audio,
	lecture.audio.startRecording
    );
    recordingController.addEventListener(
	recordingController.EVENT_TYPES.stop_audio,
	lecture.audio.stopRecording
    );

    recordingController.addEventListener(
	recordingController.EVENT_TYPES.stop_visual,
	lecture.visuals.extendCurrentSlide
    );

    recordingController.addEventListener(
	recordingController.EVENT_TYPES.stop,
	lecture.retimer.addAutoConstraints
    );
};
