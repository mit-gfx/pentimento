"use strict";
var ThumbnailModel = function(t_min, t_max, parent_id, timeline) {
    var self = {};
    var id = "thumbnail" + ThumbnailModel.counter.get();
    ThumbnailModel.counter.increment(1);
    
    self.getID = function() { return id; };
    self.t_min = Accessor(t_min);
    self.t_max = Accessor(t_max);
    self.deactivated = Accessor(false);

    ThumbnailController(self, parent_id, timeline);

    self.getContext = StaticGetter($("#" + id)[0].getContext("2d"));
    
    self.getDuration = function() {
	return self.t_max.get() - self.t_min.get();
    };   
    
    return self;
};
ThumbnailModel.counter = Accessor(0);
