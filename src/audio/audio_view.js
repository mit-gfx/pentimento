"use strict";
var AudioView = function(audio, parent_id) {    
    var $tracks_container = $("#" + audio.getID());

    // Disable all UI functionality for editing audio
    // Used during recording and playback
    var disableEditUI = function() {
/*TODO        // Disable all jQuery draggable elements in the audio timeline
        $('#'+timelineID+' .ui-draggable').draggable('disable');

        // Disable all jQuery resizable elements in the audio timeline
        $('#'+timelineID+' .ui-resizable').resizable('disable');

        // Disable certain buttons
        $('#'+deleteSegmentButtonID).prop('disabled', true);
        $('#'+insertTrackButtonID).prop('disabled', true);
        $('#'+deleteTrackButtonID).prop('disabled', true);*/
    };

    // Enable all UI functionality for editing audio
    // Used when recording or playback ends
    var enableEditUI = function() {
/*TODO        // Enable all jQuery draggable elements in the audio timeline
        $('#'+timelineID+' .ui-draggable').draggable('enable');

        // Enable all jQuery resizable elements in the audio timeline
        $('#'+timelineID+' .ui-resizable').resizable('enable');

        // Enable certain buttons
        $('#'+deleteSegmentButtonID).prop('disabled', false);
        $('#'+insertTrackButtonID).prop('disabled', false);
        $('#'+deleteTrackButtonID).prop('disabled', false);*/
    };   


    var draw = function() {	
	$tracks_container.html("");

	var $change_track = $("#" + AudioView.IDS.change_track);
        $change_track.html('');	
	
	var tracks_iter = audio.tracks.iterator();
	var i = 1;
	while (tracks_iter.hasNext()) {
	    // Add this track number to the change track selector.
	    var $option = $("<option>")
		.attr("value", i)
		.text(i);
	    $change_track.append($option);

	    // Cause track to redraw itself
	    tracks_iter.next().timeline.triggerEvent();
	    
	    i++;
	};

	// Set the change track selector to display the current track number
        $change_track.val(audio.active_track_index.get() + 1);
    };
    audio.tracks.addEventListener(draw);

    // initial draw
    draw();
};
//TODO: these elements currently exist in index.html. We should do the initial
//  drawing of them here, to make sure the ids are correct. But we never have
//  to redraw them.
AudioView.IDS = {
    controls: "audio-controls",
    delete_segments: "delete_segment_button",
    insert_track: "insert_track_button",
    delete_track: "delete_track_button",
    change_track: "track_select"
};
