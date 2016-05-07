//TODO: What if we could generalize the saveToJSON methods to just be attached here?

var copyValue = function(x) {
    switch (x.constructor) {
    case Array:
	return x.slice();
    case Object:
	var copy = {};
	for (var key in x) {
	    if (x.hasOwnProperty(key)) {
		copy[key] = copyValue(x[key]);
	    }
	}
	return copy;
    case Number:
    default:
	return x;
    }
};

// TODO: Should maybe moved to helper file
// Assumes the array_accessor entries are objects that have saveToJSON methods
// Returns array with the corresponding json
var saveArrayJSON = function(array_accessor, input) {
    var out = [];
    var iter = array_accessor.iterator();
    while (iter.hasNext()) {
	out.push(iter.next().saveToJSON(input));
    }
    return out;
};
    
var Accessor = function(initial_val) {
    var self = EventManager().initializeEvents({generic: "generic"});
    var value = initial_val;
    
    self.get = function() { return copyValue(value); };

    // This .get function can be used for both objects and arrays (in the array
    // the key is an index instead). The typeof result is "object" for both.
    if (typeof value === "object") {
	self.get = function(key) {
	    if (key === undefined) {
		return copyValue(value);
	    }
	    return copyValue(value[key]);
	};
    }
   
    var validate = function() { return true; };

    self.setValidation = function(validate_func) {
	validate = validate_func;
    };

    self.set = function(new_value) {
	if (!validate(new_value)) { return false; }
	var old_value = copyValue(value);
	undoManager.add(function() { self.set(old_value); });
	value = new_value;
	self.fireEvent(self.EVENT_TYPES.generic, value);
    };


    // Other functions that are based on what data-type value is.
    switch (value.constructor) {
    case Number:

	self.increment = function(operand) {
	    if (!validate(value + operand)) { return false; }
	    value += operand;
	    self.fireEvent(self.EVENT_TYPES.generic, value);
	    return value;
	};
	
	break;
    case Array:

	self.iterator = function() {
	    var index = -1;
	    return {
		hasNext: function() { return index < value.length - 1; },
		next: function() {
			if (this.hasNext()) {
			    index++;
			    return value[index];
			}
		}
	    };
	};

	self.indexOf = function(entry) {
	    return value.indexOf(entry);
	};

	self.valueAt = function(index) {
	    return value[index];
	};

	self.getLength = function() {
	    return value.length;
	};
	
	self.push = function(entry) {
	    value.push(entry);
	    undoManager.add(function() { self.removeValue(entry); });
	    self.fireEvent(self.EVENT_TYPES.generic, entry);
	};
	
	self.insert = function(entry, index) {
	    value.splice(index, 0, entry);
	    undoManager.add(function() { self.removeIndex(index); });
	    self.fireEvent(self.EVENT_TYPES.generic, entry);
	    return true;
	};
	
	self.removeValue = function(entry) {
	    var index = value.indexOf(entry);
	    if (index < 0) {
		console.error("Can't remove value, entry doesn't exist");
		return false;
	    } else {
		value.splice(index, 1);
		undoManager.add(function() { self.push(entry); });
		self.fireEvent(self.EVENT_TYPES.generic);
		return true;
	    }
	};
	
	self.removeIndex = function(index) {
	    var removed = value.splice(index, 1);
	    removed = removed.length > 0 ? removed[0] : null;
	    undoManager.add(function() { self.insert(removed, index); });
	    self.fireEvent(self.EVENT_TYPES.generic);
	    return removed;
	};
	
	break;
    case Object:
	
	self.set = function(new_value, key) {	    
	    if (key === undefined) {
		var old_value = copyValue(value);
		value = new_value;
	    } else {
		var old_value = copyValue(value[key])
		value[key] = new_value;
	    }
	    // Currently, if a new key is added, it's not removed when undone.
	    // It's just set to undefined. Not an issue for now, but something
	    // to be aware of.
	    undoManager.add(function() { self.set(old_value, key); });
	    self.fireEvent(self.EVENT_TYPES.generic);
	};
    default:
	break;
    }

    self.triggerEvent = function(val) {
	self.fireEvent(self.EVENT_TYPES.generic, val);
    };

    var default_add = self.addEventListener;
    self.addEventListener = function(listener) {
	default_add(self.EVENT_TYPES.generic, listener);
    };

    var default_remove = self.removeEventListener;
    self.removeEventListener = function(listener) {
	default_remove(self.EVENT_TYPES.generic, listener);
    };
    
    return self;
};
