"use strict";
/**
 * Manages any "time" field - all model fields which represent a lecture
 * timestamp should be created through this class, and destructed whenever
 * the parent model object is removed from the lecture model.
 */
var TimeManager = function() {
    var time_manager = {};
    time_manager.time_instances = Accessor([]);

    // A number that's large enough to ensure that a lecture's duration
    // will never reach it, but small enough to shift a timestamp by it
    // without going over Number.MAX_VALUE
    var MAGIC_NUMBER = 1e8;

    /**
     * Inner class to represent a "time" field. Registers itself
     * with the parent TimeManager upon instantiation, and removes
     * itself when destruct() is called.
     */
    var TimeInstance = function(time) {
	var UNINITIALIZED = -1;
	
	var time_instance = Accessor(UNINITIALIZED);

	var register = function() {
	    time_manager.time_instances.push(time_instance);
	};

	time_instance.default_set = time_instance.set;
	time_instance.set = function(new_value) {
	    if (isNaN(new_value)) {
		throw Error("NaN: " + new_value);
	    }
	    var old_value = time_instance.get();
	    if (old_value == UNINITIALIZED && new_value != UNINITIALIZED) {
		register();
	    }
	    if (new_value == UNINITIALIZED && old_value != UNINITIALIZED) {
		time_instance.destruct();
	    }
	    time_instance.default_set(new_value);
	};

	/**
	 * destructs this timestamp instance; removes itself
	 * from the parent TimeManager
	 */
	time_instance.destruct = function() {
	    time_manager.time_instances.removeValue(time_instance);
	};

	// Initialize
	time_instance.set(time);
	
	return time_instance;
    };

    /**
     * @param time the floating-point timestamp that the returned TimeInstance
     *     should represent
     * @return a TimeInstance initialized to the given timestamp, registered 
     *     with this TimeManager
     */
    time_manager.createInstance = function(time) {
        return TimeInstance(time);
    };
    
    /**
     * @param start_time every registered TimeInstance from this timestamp
     *     onward will be shifted
     * @param shift_amount every TimeInstance to be shifted will be shifted
     *     by this much
     */
    var shiftTimes = function(start_time, shift_amount) {
	var iter = time_manager.time_instances.iterator();
	while (iter.hasNext())
	{
	    var time_instance = iter.next();
	    if (time_instance.get() > start_time) {
		time_instance.increment(shift_amount);
	    }
        }
    };

    // Effectively remove TimeInstances after start_time from a lecture until
    // the shift amount is known. (The TimeInstances are shifted to a much much
    // later time in the lecture, rather than actually removed.)
    time_manager.prepareShift = function(start_time) {
	shiftTimes(start_time, MAGIC_NUMBER);
    };

    // Bring the TimeInstances back and shift them by the shift_amount
    time_manager.completeShift = function(shift_amount) {
	shiftTimes(MAGIC_NUMBER, shift_amount - MAGIC_NUMBER);
    };

    time_manager.clear = function() {
	time_manager.time_instances.set([]);
    };

    return time_manager;
};

/**
 * @return a singleton instance of TimeManager for visuals
 */
TimeManager.getVisualManager = function() {
    if (TimeManager._v_instance === undefined) {
        TimeManager._v_instance = new TimeManager();
    }
    return TimeManager._v_instance;
};

/**
 * @return a singleton instance of TimeManager for audio
 */
TimeManager.getAudioManager = function() {
    if (TimeManager._a_instance === undefined) {
        TimeManager._a_instance = new TimeManager();
    }
    return TimeManager._a_instance;
};
