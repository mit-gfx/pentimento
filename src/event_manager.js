"use strict";
var EventManager = function() {
    var self = {};
    self.EVENT_TYPES = {};
    var disabled = false;
    var listeners;

    var populateListeners = function(event_types_obj) {
	for (var type in event_types_obj) {
	    // flatten hierarchical event type objects
	    if (event_types_obj[type].constructor === Object) {
		populateListeners(event_types_obj[type]);
	    } else {
		listeners[event_types_obj[type]] = [];
	    }
	}
    };

    self.initializeEvents = function(event_types) {
	self.EVENT_TYPES = event_types;

	listeners = {};
	populateListeners(event_types);
	
	return self;
    };
    
    self.addEventListener = function(type, listener) {
	if (listeners[type] == null) {	    
	    throw Error("Unsupported event type: " + type);
	}
	listeners[type].push(listener);
    };

    self.removeEventListener = function(type, listener) {
	if (listeners[type] == null) {
	    throw Error("Unsupported event type: " + type);
	}
	var index = listeners[type].indexOf(listener);
	if (index < 0) {
	    throw Error("Cannot remove listener, it isn't attached.");
	}
	listeners[type].splice(index, 1);
    };

    
    self.fireEvent = function(type, args) {
	if (disabled) { return; }
	
	if (listeners[type] == null) {
	    throw Error("Unsupported event type: " + type);
	}
	for (var i = 0; i < listeners[type].length; i++) {
	    try {
		listeners[type][i](args);
	    } catch (e) {
		console.error(e.stack);
	    }
	}
    };

    self.disableEvents = function() {
	disabled = true;
    };

    self.enableEvents = function() {
	disabled = false;
    };
    
    return self;
};
