"use strict";
var VisualsModel = function(lecture) {
    var self = {};
    self.slides = Accessor([]);

    // TODO: get initial props from ui?
    self.current_props = {	
	color: Accessor("#000"),
	width: Accessor(2),
	type: Accessor("calligraphic")
    };

    self.getPropertiesInstance = function() {
	return VisualProperties(self.current_props.color.get(),
				self.current_props.width.get(),
				self.current_props.type.get());
    };

    self.selection = VisualsSelection(self, lecture);
    VisualsController(lecture, self);
    
    self.getDuration = function() {
	var time = 0;
	var iter = self.slides.iterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            time += slide.duration.get();
        }
	return time;
    };

    self.getSlideAtVisT = function(vis_t) {
	var iter = self.slides.iterator();
	var t_min = 0;
	var t_max = 0;
	while(iter.hasNext()) {
	    var slide = iter.next();
	    t_max += slide.duration.get();
	    if (vis_t >= t_min && vis_t < t_max) {
		return slide;
	    }
	    t_min = t_max;
	}
	// TODO: the slides should be extended properly at the end of recording,
	// but still reaching this error, so temporarily returning the last
	// slide instead of throwing the error. Maybe has to do with vis_t vs aud_t?
	return slide;
	//throw Error("getSlideAtTime(): time exceeded the lecture duration");
    };

    self.getCurrentSlide = function() {
	var aud_t = lecture.timer.current_time.get();
	return self.getSlideAtVisT(lecture.retimer.getVisualTime(aud_t));
    };
    
    self.addSlide = function(vis_t_min) {
	var slide = Slide(vis_t_min);
	if (self.slides.getLength() === 0) {
	    self.slides.push(slide);
	    slide.duration.addEventListener(self.slides.triggerEvent);
	} else {
	    var prev_slide = self.getSlideAtVisT(vis_t_min);
	    var index = self.slides.indexOf(prev_slide) + 1;
	    if (self.slides.insert(slide, index)) {
		prev_slide.duration.set(vis_t_min - prev_slide.t_min.get());
		slide.duration.addEventListener(self.slides.triggerEvent);
	    }
	}
    };
    self.addSlide(0); // Start with one slide

    self.removeSlide = function(slide) {
        if (self.slides.getLength() == 1) {
            throw Error("Only one slide left, cannot delete!");
        }
	self.slides.removeValue(slide);
	//TODO: what happens to the times of things? If we don't care about the
	// t_min of slides, just the duration, the slide itself doesn't have to
	// change, but all the visuals will happen way after the slide change
	// than expected. Also, I think making slide an official visual makes
	// us have to give slides a t_min anyways.
        return true;
    };

    self.addVisual = function(visual) {
	var slide = self.getSlideAtVisT(visual.t_min.get());
	slide.visuals.push(visual);
	self.slides.triggerEvent();
	
    };

    self.removeVisuals = function(visuals) {
	for (var i = 0; i < visuals.length; i++) {
	    var visual = visuals[i];
	    var slide = self.slides.getSlideAtVisT(visual.t_min.get());
	    slide.visuals.removeValue(visual);
	}
	self.slides.triggerEvent();
    };

    // TODO: This is a callback for when the recording stops, but what if a
    // new slide is added during the recording?
    self.extendCurrentSlide = function(e) {
	var slide = self.getCurrentSlide();
	var delta = e.end_time - e.start_time;
	slide.duration.increment(delta);
    };

    return self;
};

//TODO: need saveTo/loadFromJSON stuff
