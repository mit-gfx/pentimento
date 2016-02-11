"use strict";
var Timer = function() {
    var self = {};
    
    var UPDATE_INTERVAL = 50;  // How often to update the time, in ms    

    // These variables are -1 if they're not currently applicable
    var last_global_time = Accessor(-1);
    var begin_time = Accessor(-1);
    var end_time = Accessor(-1);

    self.current_time = Accessor(0);

    // Get bounds of the most recent timing
    self.getBeginTime = begin_time.get;
    self.getEndTime = end_time.get;

    // Returns true if a timing is in progress
    self.isTiming = function() {
        return (last_global_time.get() !== -1);
    };

    self.current_time.default_get = self.current_time.get;
    self.current_time.get = function() {
	// If the timer is progressing, bring current_time up-to-date first.
	if (self.isTiming()) {
	    updateTime(true);
	}
	return self.current_time.default_get();
    };

    self.current_time.default_set = self.current_time.set;
    self.current_time.set = function(new_time) {
	if (typeof new_time !== "number" || new_time < 0) {
	    throw Error("Timer.current_time: Invalid time " + new_time);
        }

	// Don't manually move the time if a timing is in progress
	if (self.isTiming()) {
	    return false; 
	}

	return self.current_time.default_set(new_time);
    };

    self.current_time.default_increment = self.current_time.increment;
    self.current_time.increment = function(delta_time, disable_events) {	
	if (disable_events) {
	    self.current_time.disableEvents();
	    self.current_time.default_increment(delta_time);
	    self.current_time.enableEvents();
	} else {
	    self.current_time.default_increment(delta_time);
	}
    };
    
    // Returns the current UTC time
    var globalTime = function() {
        return (new Date()).getTime();
    };

    // Calculate the elapsed time since the last update and update current_time
    var updateTime = function(disable_events) {
	var gt = globalTime();
	var time_elapsed = gt - last_global_time.get();
	last_global_time.set(gt);
	self.current_time.increment(time_elapsed, disable_events);
    };

    // updater manages the automatic time updates
    var updater = function() {
	var interval = null;
	return {
	    start: function() {
		if (interval !== null) {
		    console.error("Timer: updater is already running");
		} else {
		    interval = setInterval(function() { updateTime(); },
					   UPDATE_INTERVAL);
		}
	    },
	    stop: function() {	
		clearInterval(interval);
		interval = null;
	    }
	};
    }();
    
    self.startTiming = function() {
        if (self.isTiming()) { // Timing has already started
            return false;
        };

	last_global_time.set(globalTime());
	begin_time.set(self.current_time.get());
	end_time.set(-1);
	updater.start();
	
        return true;
    };

    self.stopTiming = function() {	
        if (!self.isTiming()) { // Timing has already stopped
            return false;
        };

	updater.stop();
	updateTime();
	end_time.set(self.current_time.get());
	last_global_time.set(-1);
	
        return true;	
    };
    
    return self;
};
