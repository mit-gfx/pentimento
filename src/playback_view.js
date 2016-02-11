"use strict";
var PlaybackView = function(playbackController) {
    var self = {};
    
    var $playback = $("#" + PlaybackView.IDS.control);

    self.startPlayback = function() {
	$playback.addClass(PlaybackView.CLASSES.in_progress);
    };

    self.stopPlayback = function() {
	$playback.removeClass(PlaybackView.CLASSES.in_progress);
    };

    return self;
};
PlaybackView.IDS = {
    control: "playback"
};
PlaybackView.CLASSES = {
    in_progress: "in-progress"
};
