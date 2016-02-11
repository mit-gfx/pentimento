//TODO: idk if thumbnails will immediately update, say if the user is editing
// and changes the color of a stroke.
"use strict";
var ThumbnailsModel = function(lecture) {
    var timeline = lecture.timeline
    var self = Accessor([]);
    self.getID = StaticGetter("thumbnails");

    ThumbnailsController(self, lecture);

    self.getThumbnailMaxDuration = function() {
	var ratio = ThumbnailsView.HEIGHT/VisualsView.HEIGHT;
	var width = Math.round(ratio*VisualsView.WIDTH);
	return timeline.pixelsToAudioTime(width);
    };

    self.addThumbnail = function(t_max) {
	var t_min = 0;
	var last_thumbnail = self.getLastThumbnail();
	if (last_thumbnail) {
	    t_min = last_thumbnail.t_max.get();
	}
	var thumbnail = ThumbnailModel(t_min, t_max, self.getID(), timeline);
	self.push(thumbnail);
	return thumbnail;
    };

    self.removeThumbnail = function(thumbnail) {
	self.removeValue(thumbnail);
	thumbnail.deactivated.set(true);
    };

    self.getLastThumbnail = function() {
	return self.valueAt(self.getLength() - 1);
    };

    self.getThumbnailAtTime = function(t) {
	var thumbnail_iter = self.iterator();
	while (thumbnail_iter.hasNext()) {
	    var thumbnail = thumbnail_iter.next();
	    if (t < thumbnail.t_max.get()) {
		return thumbnail;
	    }
	}
	throw Error("No thumbnail at time: " + t);
    };

    return self;
};
