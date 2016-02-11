"use strict";
var VisualsView = function(visuals, lecture) {
    var self = {};
    
    var $wrapper = $("#" + VisualsView.IDS.wrapper)
	.css("width", VisualsView.WIDTH)
	.css("height", VisualsView.HEIGHT);
    
    var $canvas = $("#" + VisualsView.IDS.canvas)
	.attr("width", VisualsView.WIDTH)
	.attr("height", VisualsView.HEIGHT);

    var context = $canvas[0].getContext("2d");

    var $selection_box = $("#" + VisualsView.IDS.selection);

    var renderSelectionBox = function() {
	var sel = visuals.selection;
	$selection_box.css({
	    top: sel.top.get() + "px",
	    left: sel.left.get() + "px",
	    width: sel.right.get() - sel.left.get() + "px",
	    height: sel.bottom.get() - sel.top.get() + "px"
	});
    };	
    
    self.draw = function() {
	var audio_time = lecture.timer.current_time.get();
	// renderer takes audio time
	lecture.renderer.render(context, 0, audio_time);

	renderSelectionBox();
    };

    return self;
};
//TODO: once the canvas changes size with screen width, we should store an
// aspect ratio instead of exact numbers.
VisualsView.WIDTH = 800;
VisualsView.HEIGHT = 500;
VisualsView.IDS = {
    wrapper: "sketchpadWrap",
    canvas: "sketchpad",
    selection: "selectionBox",
    selection_scale: "selection-scale"
};
