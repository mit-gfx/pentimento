"use strict";
var VisualSpatialTransform = function(mat, time) {
    var self = {};
    self.matrix = Accessor(mat);
    self.t = TimeManager.getVisualManager().createInstance(time);

    self.interpolate = function(other_transform, t_vis) {
	var start_t = self.t.get();
	var end_t = other_transform.t.get();
	if (t_vis < start_t || t_vis > end_t) {
	    throw Error("t_vis is not between the start and end transforms");
	}
	if (start_t !== end_t) {
	    var delta = t_vis - start_t;
	    var total = end_t - start_t;
            var interpolation_factor = delta/total;

	    var start_matrix = self.matrix.get();
	    var end_matrix = other_transform.matrix.get();

	    var total_diff = math.subtract(end_matrix, start_matrix)
	    var weighted_diff = math.multiply(total_diff, interpolation_factor);
	    return math.add(start_matrix, weighted_diff);
        } else {
            // The matrices are simultaneous, just use the original one
            return self.matrix.get();
        }
    };    
    
    self.saveToJSON = function() {
        var json_object = {
            matrix: self.matrix.get().valueOf(),
            t: self.t.get()
        };
        return json_object;
    };

    return self;
};

VisualSpatialTransform.loadFromJSON = function(json_object) {
    return VisualSpatialTransform(json_object.matrix, json_object.t);
};
