"use strict";
var TimelineView = function(timeline, lecture) {
    var self = {};

    var GRAPH_MARGIN = TimelineView.GRAPH_MARGIN;
    var GRAPH_BORDER = 2;
    var LABEL_MARGIN = 10;
    var LABEL_HEIGHT = 10;

    var $timeline = $("#" + TimelineView.IDS.timeline);
    var $gradations = $("#" + TimelineView.IDS.gradations);
    var $overlay = $("#" + TimelineView.IDS.overlay);
    var $playhead = $("#" + TimelineView.IDS.playhead);

    // Changes tickpoints into time display (ex: 00:30:00)
    // Each tickpoint unit is one second which is then scaled by the
    // audio_timeline_scale
    var tickFormatter = function (tickpoint) {
        var total_seconds = parseInt(tickpoint, 10);
        var hours = Math.floor(total_seconds / 3600);
        var minutes = Math.floor((total_seconds - (hours * 3600)) / 60);
        var seconds = total_seconds - (hours * 3600) - (minutes * 60);

        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }

	return  hours + ':' + minutes + ':' + seconds;
    };    
    
    self.refreshGradations = function() {
	var length = timeline.length.get();	
        var width = timeline.audioTimeToPixels(length);
	var inclusive_width = width + 2*(GRAPH_MARGIN + GRAPH_BORDER);

        // Update the dimensions
        $gradations.css('width', inclusive_width);
	$overlay.css("width", width);

	// Update the axis to display the length
	var max = Math.ceil(length/1000); // seconds
        gradations_plot.getAxes().xaxis.options.max = max;
	
        // Update the data so that the ticks are drawn correctly
	var plot_data = [ [0, 0], [0, max] ];
        gradations_plot.setData(plot_data);
	
        // Redraw and resize flot to fit the parent container
        gradations_plot.resize();
        gradations_plot.setupGrid();
        gradations_plot.draw();
    };
    
    var playheadIsVisible = function() {
	var min_left = $timeline.scrollLeft();
	var max_left = min_left + $timeline.width()
	    - GRAPH_MARGIN - GRAPH_BORDER - $playhead.width();
	var current_left = parseFloat($playhead.css("left"));
	
	return current_left >= min_left && current_left < max_left
    };

    var keepPlayheadVisible = function() {
	if (playheadIsVisible()) {
	    return;
	}
	var playhead_left = parseFloat($playhead.css("left"));
	var timeline_width = $timeline.width();
	$timeline.scrollLeft(playhead_left - timeline_width);
    };
    
    self.updatePlayhead = function(time) {
	var left = timeline.audioTimeToPixels(lecture.timer.current_time.get());
	$playhead.css('left', left);
	keepPlayheadVisible();
    };

    // Initial drawing
    
    var side_padding = GRAPH_MARGIN + GRAPH_BORDER + LABEL_MARGIN + "px";
    var top_padding = GRAPH_MARGIN + GRAPH_BORDER + "px";
    $overlay.css("padding", top_padding + " " + side_padding);

    var options = {
        yaxis: {
            ticks: {show: true}
        },
        xaxis: {
            min: 0,
            max: 100,  // dummy initial value
            tickFormatter: tickFormatter,
            labelHeight: LABEL_HEIGHT,
        },
        grid: {
            margin: GRAPH_MARGIN,
            minBorderMargin: 0,
            borderWidth: GRAPH_BORDER,
            labelMargin: LABEL_MARGIN,
        }
    };
    var plot_data = [ [0, 0], [0, 100] ]; // dummy data
    var gradations_plot = $.plot($gradations, plot_data, options);
    self.refreshGradations();

    return self;
};
TimelineView.IDS = {
    timeline: "timeline",
    controls: "timeline-controls",
    overlay: "gradations-overlay",
    zoom_in: "zoom-in-button",
    zoom_out: "zoom-out-button",
    playhead: "playhead",
    gradations: "gradations"
};
TimelineView.GRAPH_MARGIN = 20;
