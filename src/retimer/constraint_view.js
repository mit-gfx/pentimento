var ConstraintView = function(constraint, lecture) {
    var self = {};
    var $parent = $("#" + RetimerView.IDS.constraints);
    
    var ID = constraint.getID();
    var COLORS = {
	selected: "#FF0000",
	manual: "#000000",
	auto: "#BDBDBD"
    };   
	
    // Initialize layer
    $parent.drawLine({
        layer: true,
        name: ID,
	groups: [ConstraintView.LAYER_GROUP],
        strokeStyle: COLORS.manual,
        strokeWidth: ConstraintView.WIDTH,
        rounded: true,
        startArrow: true,
        endArrow: true,
        arrowRadius: ConstraintView.HANDLE_RADIUS,
        arrowAngle: 90
    });

    self.draw = function() {	
	if (!constraint.isRegistered()) {
	    $parent.setLayer(ID, {visible: false}).drawLayers();
	    return;
	}
	
	var x = lecture.timeline.audioTimeToPixels(constraint.t_audio.get());
	var y_min = ConstraintView.HANDLE_RADIUS;
	var y_max = $parent.height() - ConstraintView.HANDLE_RADIUS;

	var color = constraint.selected.get() ? COLORS.selected :
	    constraint.auto.get() ? COLORS.auto : COLORS.manual;

	$parent.setLayer(ID, {
	    visible: true,
	    strokeStyle: color,
	    x1: x,
	    y1: y_min,
	    x2: x,
	    y2: y_max
	}).drawLayers();
    };
        
    self.drawAt = function(x_aud, x_vis) {
	$parent.setLayer(ID, {x1: x_vis, x2: x_aud}).drawLayers();
    };

    return self;
};
ConstraintView.LAYER_GROUP = "constraints";
ConstraintView.HANDLE_RADIUS = 10;
ConstraintView.WIDTH = 4;
