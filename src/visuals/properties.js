"use strict";
var VisualProperties = function(c, w, st) {
    var validateWidth = function(new_w){
	if (isNaN(parseFloat(new_w))) {	    
	    throw Error("Can't cast width to a number");
	}
	return true;
    }
    validateWidth(w);
    
    var self = {};
    self.color = Accessor(c);
    self.width = Accessor(parseFloat(w));
    self.width.setValidation(validateWidth);
    // TODO: look into accessor and stroke type
    self.type = Accessor(st);

    // Modify width.set to convert its new value to a number
    self.width.defaultSet = self.width.set;
    self.width.set = function(new_width) {
	self.width.defaultSet(parseFloat(new_width));
    };

    self.saveToJSON = function() {
        var json_object = {
            c: self.color.get(),
            w: self.width.get(),
            st: self.type.get()
        };

        return json_object;
    };
    
    return self;
};
VisualProperties.loadFromJSON = function(json_object) {
    return VisualProperties(json_object.c, json_object.w, json_object.st);
};

var VisualPropertyTransform = function(property_name, val, time) {
    var self = {};
    self.t = TimeManager.getVisualManager().createInstance(time);

    // read-only variables, create a new transform for different values
    self.property_name = StaticGetter(property_name);
    self.value = StaticGetter(val);

    self.saveToJSON = function() {
        var json_object = {
            property_name: self.property_name.get(),
            value: self.value.get(),
            t: self.t.get()
        };

        return json_object;
    };

    return self;
};

VisualPropertyTransform.loadFromJSON = function(json_object) {
    var visualPropertyTransform = VisualPropertyTransform(
	VisualProperty.loadFromJSON(json_object.property_name,
				    json_object.value,
				    json_object.t));
    return visualPropertyTransform;
};
