"use strict";
var RetimerView = function(lecture, retimer) {
    var self = {};

    // Retimer controls
    
    var $add_constraint = $("<div>")
	.attr("id", RetimerView.IDS.add_constraint);
    var $delete_constraints = $("<div>")
	.attr("id", RetimerView.IDS.delete_constraints);

    var $retimer_controls = $("<div>")
	.attr("id", RetimerView.IDS.controls)
	.append($add_constraint)
	.append($delete_constraints);

    //TODO: don't hardcode
    $("#retimer-audio_controls_container").append($retimer_controls);

    
    // Constraints container   
    
    var TICK_MARKS_GROUP = "tick_marks"
    var TICK_GAP = 150; //milliseconds, in visual time
    var HEIGHT = 100;
    var SELECTION_LAYER = "selection";

    var $constraints = $("#" + RetimerView.IDS.constraints)
	.attr("width", 0)
	.attr("height", HEIGHT)
	.addLayer({
	    name: SELECTION_LAYER,
	    type: "rectangle",
	    fillStyle: "#AABBFF",
	    opacity: 0.5,
	    x: 0,
	    y: HEIGHT/2, // y is the center, not the top edge
	    width: 0,
	    height: HEIGHT
	});

    self.drawSelection = function() {
	var start = retimer.selection.start_x.get();
	var end = retimer.selection.end_x.get();
	var width = end - start;
	$constraints.setLayer(SELECTION_LAYER, {
	    x: start + width/2, // x is the center, not the left edge
	    width: width
	}).drawLayers();
    };
    
    var drawTickMarks = function(){
	// Remove prior tick marks
	$constraints.removeLayerGroup(TICK_MARKS_GROUP);
	
        var max_t_vis = retimer.getVisualTime(lecture.getDuration());
	
        for(var t_vis = 0; t_vis < max_t_vis; t_vis += TICK_GAP) {
            var t_aud = retimer.getAudioTime(t_vis);
            var x_aud = lecture.timeline.audioTimeToPixels(t_aud);	    
            $constraints.drawLine({
                layer: true,
		groups: [TICK_MARKS_GROUP],
                bringToFront: true,
                strokeStyle: '#BDBDBD',
                strokeWidth: 1,
                rounded: true,
                x1: x_aud, y1: 0,
                x2: x_aud, y2: 10
            });
        }
    };

    self.draw = function() {
	// update width
	var max_t = lecture.getDuration();
	var new_width = lecture.timeline.audioTimeToPixels(max_t);
	$constraints.attr("width", new_width);

	//update tickmarks
        drawTickMarks();
    };

    return self;
};

RetimerView.IDS = {
    constraints: "constraints",
    controls: "retimer-controls",
    add_constraint: "add-constraint",
    delete_constraints: "delete-constraints"
    //TODO: there was another button that didn't work but was called "retimer_record_Audio". What was that for, and should it be added back?
};
