"use strict";
var StrokeVisual = function(t_min, props) {    
    var self = Visual(t_min, props);
    self.type = Accessor(Visual.TYPES.stroke);
    self.vertices = Accessor([]);
    
    // Overrides the parent applySpatialTransform()
    // matrix is 3x3
    // conslidate - conslidate this transform with the previous transform
    self.applySpatialTransform = function(matrix, vis_t, consolidate) {
	if (vis_t == null) {
	    var iter = self.vertices.iterator();
	    while (iter.hasNext()) {
		var vertex = iter.next();
		var vertex_array = [vertex.x.get(), vertex.y.get(), 1];
		
		// Need to call .valueOf on instances of math.matrix to be able
		// to index into them. This does nothing to array matrices.
		var result = math.multiply(matrix, vertex_array).valueOf();
		vertex.x.set(result[0]);
		vertex.y.set(result[1]);
	    }
	} else {
	    var prev_trans = self.spatial_transforms.getTransformAtTime(vis_t);
	    var prev_matrix = prev_trans.matrix.get();
	    // TODO: are the arguments to math.multiply in the right order?
	    var new_matrix = math.multiply(matrix, prev_matrix);

	    if (consolidate) {
		prev_trans.matrix.set(new_matrix);
	    } else {
		var new_transform = VisualSpatialTransform(new_matrix, vis_t);
		self.spatial_transforms.insertTransformByTime(new_transform);
	    }
	}
    };

    self.applyPropertyTransform = function(prop_name, prop_val, t) {
	if (t == null) {
	    self.properties[prop_name].set(prop_val);
	} else {
	    var transform = VisualPropertyTransform(prop_name, prop_val, t);
	    self.property_transforms.insertTransformByTime(transform);
	}
    };

    self.isWithinBox = function(vis_t, top, right, bottom, left) {	
        if (!self.isVisible(vis_t)) { 
            return false;
        };

        var n_vtx = 0;
	var iter = self.vertices.iterator();
        while (iter.hasNext()) {
            var vertex = iter.next();
	    var x = vertex.x.get();
	    var y = vertex.y.get();
            if (vertex.isVisible(vis_t) && x > left && x < right
		&& y > top && y < bottom) { 
                n_vtx++; 
            };
        };

        // If more than half of the vertices are in the box, it is considered
	// within it.
        if ( n_vtx >= self.vertices.get().length / 2 ) {
            return true;
        };
	return false;
    };

    // In addition to having its transforms shifted in time, Strokes need    
    // their vertices shifted too.
    self.default_shift = self.shift;
    self.shift = function(amount) {
	self.default_shift();

	var iter = self.vertices.iterator();
        while (iter.hasNext()) {
            iter.next().t.increment(amount);
        }
    };    
	
    // Saving the model to JSON
    self.saveToJSON = function() {

        // Call parent method
        var json_object = Visual.saveToJSON.call(self);

        // Add the fields belonging to the child object
        json_object.vertices = saveArrayJSON(self.vertices);

        return json_object;
    };

    return self;
};

StrokeVisual.loadFromJSON = function(json_object) {

    // Load the child class attributes only
    var props = VisualProperties.loadFromJSON(json_object.properties);
    var stroke_visual = StrokeVisual(json_object.t_min, props);

    // Add the vertices
    var json_verticies = json_object.vertices;
    var loaded_vertices = [];
    for (var i = 0; i < json_verticies.length; i++) {
        loaded_vertices.push(Vertex.loadFromJSON(json_verticies[i]))
    };
    stroke_visual.vertices.set(loaded_vertices);

    return stroke_visual;
};

