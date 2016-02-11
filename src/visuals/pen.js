var PenTool = function(visuals) {
    var self = Tool();

    var current_visual = null;
    self.start = function(e) {
	current_visual = StrokeVisual(e.vis_t, visuals.getPropertiesInstance());
	self.update(e);
	visuals.addVisual(current_visual);
    };
    self.update = function(e) {
	for (var i = 0; i < e.coords.length; i++) {
	    var coord = e.coords[i];
	    var vertex = Vertex(coord.x, coord.y, e.vis_t); //TODO: pressure???
	    current_visual.vertices.push(vertex);
	}
    };
    
    self.stop = function() {
	current_visual = null;
    };

    return self;
};
