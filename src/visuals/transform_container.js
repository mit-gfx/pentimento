"use strict";
var TransformContainer = function(spatial) {
    var initial_transforms = [];
    if (spatial) {
	var identity_matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
	initial_transforms = [VisualSpatialTransform(identity_matrix, 0)];
    }
    
    var self = Accessor(initial_transforms);

    self.getIndexByTime = function(time) {
	var index = -1;
	var iter = self.iterator();
	while (iter.hasNext()) {
	    var t = iter.next().t.get();
	    if (time < t) {
		break;
	    }
	    index++
	}
	return index;
    };

    self.insertTransformByTime = function(new_transform) {
	var index = self.getIndexByTime(new_transform.t.get()) + 1;
	self.insert(new_transform, index);
    };

    self.getTransformAtTime = function(time) {
	var index = self.getIndexByTime(time);
	return self.get(index);
    };

    self.removeTransformAtTime = function(time) {
	var index = self.getIndexByTime(time);
	self.removeIndex(index);
    };

    return self;
};
