// Manages the lecture time
// Time is kept to whole millisecond units.
// Allows objects to register time update and recording/playback status callbacks.
// Allows objects to change the current time and begin/end recording/playback.
'use strict';

var TimeController = function() {

    ////////////////////////////////////////////////////////
    // Private member variables
    ////////////////////////////////////////////////////////

    var self = this;

    // Keeps track of the current lecture time
    var currentTime = function() {
	var value = 0;
	return {
	    set: function(new_value, notify_listeners) {
		var old_value = value;
		value = new_value;

		// Notify callbacks
		if (notify_listeners) {
		    for (var i = 0; i < updateTimeCallbacks.length; i++) {
			updateTimeCallbacks[i](value);
		    };
		}
	    },
	    get: function() { return value; }
	};
    }();

    // Keeps track of the last UTC global time to calculate time passed when the timer is progressing.
    // When the value is not -1, it indicates that we are currently timing.
    var lastGlobalTime = function() {
	var value = -1;
	return {
	    set: function(new_value) {
		var old_value = value;
		value = new_value;
	    },
	    get: function() { return value; }
	};
    }();

    // When the previous or current timer began/ended (lecture time)
    var beginTime = function() {
	var value = -1;
	return {
	    set: function(new_value) {
		var old_value = value;
		value = new_value;
	    },
	    get: function() { return value; }
	};
    }();
    var endTime = function() {
	var value = -1;
	return {
	    set: function(new_value) {
		var old_value = value;
		value = new_value;
	    },
	    get: function() { return value; }
	};
    }();

    // Keep track of the interval timer for time updates
    var updateInterval = function() {
	var func = null
	var interval_time = null;
	var interval_id = null;
	return {
	    set: function(f, t) {
		var old_func = func;
		var old_interval_time = interval_time;
		func = f;
		interval_time = t;
		clearInterval(interval_id);
		interval_id = setInterval(func, interval_time);
	    },
	    get: function() { return value; }
	};
    }();

    // Interval after which to notify listeners of a time update during timer progression
    var UPDATE_INTERVAL = 50;  // milliseconds

    // Callback functions to notify listeners.
    // Functions should have one argument: currentTime (milliseconds)
    var updateTimeCallbacks = [];  // When the current time changes, including when timing ends

    ////////////////////////////////////////////////////////
    // Methods
    ////////////////////////////////////////////////////////

    // Register callback for a time update
    this.addUpdateTimeCallback = function(callback) {
        updateTimeCallbacks.push(callback);
    };

    // Get the current time (ms)
    // When the timer is progressing, it pulls the current time forward rather
    // than just relying on the time that was updated during the update interval.
    this.getTime = function() {
        // During a timing, use and update the last global time to get the new current time
        if (self.isTiming()) {
            // Calculate the elapsed time since the last update
            var gt = globalTime();
            var timeElapsed = gt - lastGlobalTime.get();
            lastGlobalTime.set(gt);

            // Update the time without notifying callbacks
            // The reasoning is that if there are too many calls to getTime, we could be 
            // overloaded with too many callbacks to updateTime listeners.
            currentTime.set(currentTime.get() + timeElapsed, false);
        };
        return currentTime.get();
    };

    // Manually update the current time and notify any callbacks
    // This cannot be done while a timing is in progress.
    this.updateTime = function(time) {
        if (typeof time !== "number" || time < 0) {
            console.error("Invalid time: " + time);
        };

        // If during a timing, then exit
        if (self.isTiming()) {
            return;
        };

        // Update the current time with the new time
        currentTime.set(Math.round(time), true);
    };

    // Use UTC time to keep track of timing when it is in progress
    var globalTime = function() {
        return (new Date()).getTime();
    };

    // Returns true if a timing is in progress
    this.isTiming = function() {
        return (lastGlobalTime.get() !== -1);
    };

    // Start progressing the time
    // Returns true if succeeds
    this.startTiming = function() {

        // If a timing is in progress, a timing cannot be started
        if (self.isTiming()) {
            return false;
        };

        // Keep track of the global time to know how much time has elapsed
        lastGlobalTime.set(globalTime());

        // Keep track of the time when timing began
	beginTime.set(currentTime.get());

        // After a set interval, update the current time and notify any listeners of the time update
        updateInterval.set(function() {

            // Calculate the elapsed time since the last update and update the current time
            var gt = globalTime();
            var timeElapsed = gt - lastGlobalTime.get();
            lastGlobalTime.set(gt);
            currentTime.set(currentTime.get() + timeElapsed, true);

        }, UPDATE_INTERVAL);

        return true;
    }
    
    // Stop progressing the time
    // Returns true if succeeds
    this.stopTiming = function() {

        // If a timing is not in progress, the timing cannot be stopped
        if (!self.isTiming()) {
            return false;
        };

        // Clear the interval used for timing updates
        updateInterval.set(null);

        // Calculate the new current time
        var timeElapsed = globalTime() - lastGlobalTime.get();
        currentTime.set(currentTime.get() + timeElapsed, true);

        // Record when the timing ended
        endTime.set(currentTime.get());

        // Reset the global time
        lastGlobalTime.set(-1);

        return true;
    };

    // Get the time (ms) when the previous or current timing began
    // Returns -1 if there was no previous or current event
    this.getBeginTime = function() {
        return beginTime.get();
    };

    // Get when the previous timing ended.
    // Returns -1 if there was no previous event
    this.getEndTime = function() {
        return endTime.get();
    };

};
