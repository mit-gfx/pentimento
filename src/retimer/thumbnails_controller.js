"use strict";
var ThumbnailsController = function(thumbnails, lecture) {
    var renderer = lecture.renderer;
    var EXTRA_DURATION = 10;

    ThumbnailsView(thumbnails);
    
    var updateLength = function() {
	//TODO: I think eventually we want the durations to update as
	// current_time does, so this call to max shouldn't be necessary
	// at that point
	var t = Math.max(lecture.getDuration(),
			 lecture.timer.current_time.get());
	t += EXTRA_DURATION;
	var max_thumbnail_duration = thumbnails.getThumbnailMaxDuration();
	var last_thumbnail = thumbnails.getLastThumbnail();
	if (!last_thumbnail) {
	    thumbnails.addThumbnail(max_thumbnail_duration);
	    last_thumbnail = thumbnails.getLastThumbnail()
	}
	if (t < last_thumbnail.t_max.get()) {
	    while (t < last_thumbnail.t_min.get()) {
		thumbnails.removeThumbnail(last_thumbnail);
		last_thumbnail = thumbnails.getLastThumbnail();
	    }
	    last_thumbnail.t_max.set(t);
	} else {
	    var max_t_max = last_thumbnail.t_min.get() + max_thumbnail_duration;
	    while (t >= max_t_max) {
		last_thumbnail.t_max.set(max_t_max);
		last_thumbnail = thumbnails.addThumbnail(max_t_max);
		max_t_max += max_thumbnail_duration;
	    }
	    last_thumbnail.t_max.set(t);	   
	}
    };
    // TODO: once the lecture duration updates with current time, this can
    //  be added to lecture duration instead of current time to cut down on
    //  the number of calls.
    lecture.timer.current_time.addEventListener(updateLength);

    var updateThumbnail = function(thumbnail) {
	var context = thumbnail.getContext();
	renderer.render(thumbnail.getContext(), thumbnail.t_min.get(),
			thumbnail.t_max.get(), ThumbnailsView.PAST_COLOR);
    };
	
    
    var updateAllThumbnails = function() {
	var iter = thumbnails.iterator();
	while (iter.hasNext()) {
	    updateThumbnail(iter.next());
	}
    };
    lecture.retimer.addEventListener(updateAllThumbnails);

    var updateCurrentThumbnail = function() {
	var t = lecture.timer.current_time.get();	
	updateThumbnail(thumbnails.getThumbnailAtTime(t));
    };
    lecture.timer.current_time.addEventListener(updateCurrentThumbnail);   
    
};
