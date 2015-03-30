// Manages the lecture time
// Allows objects to register time update and recording/playback status callbacks.
// Allows objects to change the current time and begin/end recording/playback.
pentimento.timeController = new function() {

    ////////////////////////////////////////////////////////
    // Private member variables
    ////////////////////////////////////////////////////////

    var self = this;

    // Keeps track of the current lecture time
    var currentTime = 0;

    // When the last timer began (lecture time)
    var lastBeginTime = -1;  // Set at the beginning of every recording or playback

    // Keeps track of the last UTC global time to calculate time passed when the timer is progressing
    // -1 indicates that the timer is not moving
    var lastGlobalTime = -1;

    // Indicates a recording is happening when the timer is progressing (lastGlobalTime != -1)
    // If false during a timer progression, then a playback is occuring instead.
    var isRecording = false;

    // Keep track of the interval timer for time updates
    var updateInterval = null;

    // Interval after which to notify listeners of a time update during timer progression
    var UPDATE_INTERVAL = 50;  // milliseconds

    // Callback functions to notify listeners.
    // Function arguments are listed in the comments. All times are in milliseconds
    var updateTimeCallbacks = [];  // When the current time changes (currentTime)
    var beginRecordingCallbacks = [];  // When a recording begins (currentTime)
    var endRecordingCallbacks = [];  // When a recording ends (beginTime, endTime)
    var beginPlaybackCallbacks = [];  // When a playback begins (currentTime)
    var endPlaybackCallbacks = [];  // When a playback ends (beginTime, endTime)

    ////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////

    // Register callbacks
    this.addUpdateTimeCallback = function(callback) {
        updateTimeCallbacks.push(callback);
    };
    this.addBeginRecordingCallback = function(callback) {
        beginRecordingCallbacks.push(callback);
    };
    this.addEndRecordingCallback = function(callback) {
        endRecordingCallbacks.push(callback);
    };
    this.addBeginPlaybackCallback = function(callback) {
        beginPlaybackCallbacks.push(callback);
    };
    this.addEndPlaybackCallback = function(callback) {
        endPlaybackCallbacks.push(callback);
    };

    // Get the current time (ms)
    this.getTime = function() {
        return currentTime;
    };

    // Returns true if a recording is in progress
    this.isRecording = function() {
        return (isTiming() && isRecording);
    };

    // Returns true if a playback is in progress
    this.isPlaying = function() {
        return (isTiming() && !isRecording);
    };

    // Get the time (ms) when the last recording/playback began
    // Returns -1 if there was no previous event
    this.getBeginTime = function() {
        return lastBeginTime;
    };

    // Update the current time and notify any callbacks
    this.updateTime = function(time) {

        currentTime = time;

        // Notify callbacks
        for (var i = 0; i < updateTimeCallbacks.length; i++) {
            updateTimeCallbacks[i](currentTime);
        };
    };

    // Start recording and notify callbacks
    this.startRecording = function() {
        // Start the timing
        // If it suceeds, set the recording variable and notify listeners
        if (startTiming()) {
            isRecording = true;
            for (var i = 0; i < beginRecordingCallbacks.length; i++) {
                beginRecordingCallbacks[i](currentTime);
            };
        };
    };

    // Stop recording and notify callbacks
    this.stopRecording = function() {
        // Stop the timing
        // If it suceeds, notify listeners
        if (stopTiming()) {
            for (var i = 0; i < endRecordingCallbacks.length; i++) {
                endRecordingCallbacks[i](lastBeginTime, currentTime);
            };
        };
    };

    // Start playback and notify callbacks
    this.startPlayback = function() {
        // Start the timing
        // If it suceeds, set the recording variable to indicate playback and notify listeners
        if (startTiming()) {
            isRecording = false;
            for (var i = 0; i < beginPlaybackCallbacks.length; i++) {
                beginPlaybackCallbacks[i](currentTime);
            };
        };
    };

    // Stop playback and notify callbacks
    this.stopPlayback = function() {
        // Stop the timing
        // If it suceeds, notify listeners
        if (stopTiming()) {
            for (var i = 0; i < endPlaybackCallbacks.length; i++) {
                endPlaybackCallbacks[i](lastBeginTime, currentTime);
            };
        };
    };

    ////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////

    // Returns true if a playback or recording is in progress
    var isTiming = function() {
        return (lastGlobalTime !== -1);
    };

    // Start progressing the time
    // Used by startRecording and startPlayback
    // Returns true if succeeds
    var startTiming = function() {

        // If a timing is in progress, a timing cannot be started
        if (self.isTiming()) {
            return false;
        };

        // Keep track of the global time to know how much time has elapsed
        lastGlobalTime = globalTime();

        // Keep track of the time when timing began
        lastBeginTime = currentTime;

        // After a set interval, update the current time and notify any listeners of the time update
        updateInterval = setInterval(function() {

            // Calculate the elapsed time since the last update
            var gt = globalTime();
            var timeElapsed = gt - lastGlobalTime;
            lastGlobalTime = gt;

            // Update the time.
            // This also notifies callbacks
            self.updateTime(currentTime + timeElapsed);

        }, UPDATE_INTERVAL);

        return true;
    }
    
    // Stop progressing the time
    // Used by stopRecording and stopPlayback
    // Returns true if succeeds
    var stopTiming = function() {

        // If a timing is not in progress, the timing cannot be stopped
        if (!self.isTiming()) {
            return false;
        };

        // Clear the interval used for timing updates
        clearInterval(updateInterval);
        updateInterval = null;

        // Calculate the new current time
        currentTime += (globalTime() - lastGlobalTime);

        // Reset the global time to indicate that the timing has stopped
        lastGlobalTime = -1;

        return true;
    };
};
