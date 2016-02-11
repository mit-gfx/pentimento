"use strict";
var SegmentView = function(segment, parent_id, lecture) {
    var self = {};
    var timeline = lecture.timeline;
    var $segment, $wave_container;
    var wavesurfer = segment.getWavesurfer();  // wavesurfer to play audio

    // As the elements are redrawn, these variables reference elements that are
    // no longer in the DOM. Update them to reference the current elements.
    var updateElementVariables = function() {
	$segment = $("#" + segment.getID());
	$wave_container = $segment.children(
	    "." + SegmentView.CLASSES.wavesurfer_container);
    };
   
    // Update the position and size of the wavesurfer container so that only
    // the portion of audio that should be played is visible.
    var updateWavePosition = function() {
	updateElementVariables();

	var orig_length = segment.getOriginalLength();
	var width = timeline.audioTimeToPixels(orig_length);	
    	var left = timeline.audioTimeToPixels(-segment.start_time.get());
	$wave_container.css({ 'left': left + "px", 'width': width + "px" });
    };

    //TODO: performance - only completely redraw elements when necessary
    self.redraw = function() {
	var width = timeline.audioTimeToPixels(segment.getDuration());
    
        var $new_segment = $("<div>")
	    .attr("id", segment.getID())
	    .attr("class", SegmentView.CLASSES.segment)
	    .css("width", width);
	
	var $drag_handle = $("<div>")
	    .addClass(SegmentView.CLASSES.handle)
	    .addClass(SegmentView.CLASSES.drag);
	
        var $ws_container = $("<div>")
	    .attr("class", SegmentView.CLASSES.wavesurfer_container);

	var $crop_start_handle = $("<div>")
	    .addClass(SegmentView.CLASSES.handle)
	    .addClass(SegmentView.CLASSES.crop_start);
	
	var $crop_end_handle = $("<div>")
	    .addClass(SegmentView.CLASSES.handle)
	    .addClass(SegmentView.CLASSES.crop_end);
		  
        $("#" + parent_id).append($new_segment);
        $new_segment.append($drag_handle)
            .append($ws_container)
	    .append($crop_start_handle)
	    .append($crop_end_handle);

        wavesurfer.init({
            container: $ws_container[0],
            waveColor: '#848484',
            progressColor: 'purple',
            height: parseInt($ws_container.css('height')),
            minPxPerSec: 1
        });
	
        wavesurfer.load(segment.getAudioURL());
    };
    
    segment.start_time.addEventListener(self.redraw);
    segment.end_time.addEventListener(self.redraw);

    // Add this after self.redraw has been added, so redraw happens first.
    segment.start_time.addEventListener(updateWavePosition);    
};

SegmentView.CLASSES = {
    segment: "audio-segment",
    handle: "segment-handle",
    wavesurfer_container: "wavesurfer-container",
    drag: "segment-drag",
    crop_start: "segment-crop-start",
    crop_end: "segment-crop-end"
};
