//TODO: What if we could generalize the saveToJSON methods to just be attached here?

//TODO: create a way to add a validation function to the setters. If the validation function returns true, the value is set. 

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
    

var Accessor = function(initial_val, write_protected, password) {
    var value = initial_val;
    var self = {};

    // Read methods
    
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

    switch (value.constructor) {
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
	
	self.reverse_iterator = function() {
	    var index = value.length;
	    return {
		hasNext: function() { return index > 0; },
		next: function() {
		    if (this.hasNext()) {
			index--;
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
	}

	self.getLength = function() {
	    return value.length;
	}
	
	break;
    default:
	break;
    }

    if (write_protected && password == null) {
	return self; // Read_only, return now so write methods aren't added
    }

    // Event Listeners

    var listeners = [];
    var events_disabled = false;

    self.addEventListener = function(callback) {
	listeners.push(callback);
    };

    self.removeEventListener = function(callback) {
	var index = listeners.indexOf(callback);
	if (index < 0) {
	    throw Error("Accessor.removeEventListener: listener is not attached");
	}
	listeners.splice(index, 1);
    };
    
    var fireEvent = function(val) {
	if (events_disabled) {
	    return;
	}
	for (var i = 0; i < listeners.length; i++) {
	    try {
		listeners[i](val);
	    } catch (e) {
		// Show the error, but continue with the other listeners
		console.error(e.stack);
	    }
	}
    };

    self.triggerEvent = function(val) {
	fireEvent(val);
    };

    var write_function_names = [];
    
    self.disableEvents = function() {
	events_disabled = true;
    };
    write_function_names.push("disableEvents");

    self.enableEvents = function() {
	events_disabled = false;
    };
    write_function_names.push("enableEvents");
    


    var validate = function() { return true; };

    self.setValidation = function(validate_func) {
	validate = validate_func;
    };

    // Write methods
    
    self.set = function(new_value) {
	if (!validate(new_value)) { return false; }
	var old_value = copyValue(value);
	undoManager.add(function() { self.set(old_value); });
	value = new_value;
	fireEvent(value);
    };
    write_function_names.push("set");

    switch (value.constructor) {
    case Number:

	self.increment = function(operand) {
	    if (!validate(value + operand)) { return false; }
	    value += operand;
	    fireEvent(value);
	    return value;
	};
	write_function_names.push("increment");
	
	break;
    case Array:
	
	self.push = function(entry) {
	    value.push(entry);
	    undoManager.add(function() { self.removeValue(entry); });
	    fireEvent(entry);
	};
	write_function_names.push("push");
	
	self.insert = function(entry, index) {
	    value.splice(index, 0, entry);
	    undoManager.add(function() { self.removeIndex(index); });
	    fireEvent(entry);
	    return true;
	};
	write_function_names.push("insert");
	
	self.removeValue = function(entry) {
	    var index = value.indexOf(entry);
	    if (index < 0) {
		console.error("Accessor.remove(): entry doesn't exist");
		return false;
	    } else {
		value.splice(index, 1);
		undoManager.add(function() { self.push(entry); });
		fireEvent();
		return true;
	    }
	};
	write_function_names.push("removeValue");
	
	self.removeIndex = function(index) {
	    var removed = value.splice(index, 1);
	    removed = removed.length > 0 ? removed[0] : null;
	    undoManager.add(function() { self.insert(removed, index); });
	    fireEvent();
	    return removed;
	};
	write_function_names.push("removeIndex");

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
	    // Currently, if a new key is added, it's not removed when undone, but
	    // set to undefined. Not an issue for now, but something to be aware of.
	    undoManager.add(function() { self.set(old_value, key); });
	    fireEvent();
	};
	// "set" has already been added to write_function_names
	
	break;
    default:
	break;
    }

    var password_wrap = function(f) {	
	return function() {
	    var password_arg = arguments[arguments.length - 1];
	    if (password_arg === password) {
		f.apply(this, arguments);
	    } else {
		console.error("Write-protected, incorrect password");
	    }
	};
    };

    if (write_protected) {
	for (var i = 0; i < write_function_names.length; i++) {
	    var function_name = write_function_names[i];
	    self[function_name] = password_wrap(self[function_name]);
	}
    }

    return self;
};
