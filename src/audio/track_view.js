"use strict";
var TrackView = function(track, parent_id, timeline) {
    var self = {};
    
    var trackClass = "audio-track";
    var $parent = $("#" + parent_id);

    var updateSegmentLocations = function() {
	var iter = track.timeline.iterator();
	while (iter.hasNext()) {
	    var entry = iter.next();
	    var segment = entry.segment;
	    var left = timeline.audioTimeToPixels(entry.track_time.get());
	    $("#" + segment.getID()).css("left", left + "px");
	}
    };

    self.manuallyChangeSegment = function(segment_id, delta_left, delta_width) {
	var old_left = $("#" + segment_id).css("left");
	old_left = parseInt(old_left.substring(0, old_left.length - 2));
	var css_props = {left: old_left + delta_left + "px"};
	if (delta_width != null) {
	    var old_width = $("#" + segment_id).css("width");
	    old_width = parseInt(old_width.substring(0, old_width.length - 2));
	    css_props.width = old_width + delta_width + "px";
	}
	$("#" + segment_id).css(css_props);
    };

    self.manuallyChangeWavesurfer = function(segment_id, delta_left) {
	var $wavesurfer_container = $("#" + segment_id + " ." +
				      SegmentView.CLASSES.wavesurfer_container);
	var old_left = $wavesurfer_container.css("left");
	old_left = parseInt(old_left.substring(0, old_left.length - 2));
	$wavesurfer_container.css("left", old_left+delta_left + "px");
    };
    
    // Draw a track into the parent container
    self.draw = function() {
	// Make sure the previously drawn track doesn't exist
	$("#" + track.getID()).remove();
	
        var $track = $("<div>")
	    .attr("id", track.getID())
	    .attr("class", trackClass);	
        $parent.append($track);

	// trigger each segment so that they redraw themselves
	var iter = track.timeline.iterator();
	while (iter.hasNext()) {
            var segment = iter.next().segment;	    
	    segment.start_time.triggerEvent();
        };

        updateSegmentLocations();
    };

    return self;
};
