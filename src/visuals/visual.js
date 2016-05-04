"use strict";
// Abstract base visual class
var Visual = function(tmin, props) {    
    var self = {};
    self.type = Accessor(Visual.TYPES.none);
    self.t_min = TimeManager.getVisualManager().createInstance(tmin);
    self.t_del = TimeManager.getVisualManager().createInstance(-1);
    self.spatial_transforms = TransformContainer(true);
    self.property_transforms = TransformContainer();
    self.properties = props;
    self.selected = Accessor(false);

    // Apply a spatial transform to the visual. If t is provided, apply the
    // transform only at that time. Else, apply the transform to the visual
    // at all points in time.
    // The transform is a math.js matrix.
    // This method needs to be overridden by child classes.
    self.applySpatialTransform = function(transform, t) {
        throw Error("Visual.applySpatialTransform() needs to be overridden "
		      + " by child class");
    };

    // Returns the properties at the given time (non-interpolated)
    self.getPropertiesAtTime = function(time) {
        var result = new VisualProperties(self.properties.color.get(),
	    self.properties.width.get(),
        self.properties.type.get());

	var iter = self.property_transforms.iterator();
	while (iter.hasNext()) {
	    var transform = iter.next();
	    if (transform.t.get() < time) {
		var name = transform.property_name.get();
		var value = transform.value.get();
		result[name].set(value);
            } else {
                break;
            }
        }
        return result;
    };

    // A visual is considered visible in the interval of [t_min, t_del) 
    self.isVisible = function(t_visual) {
	var t_min = self.t_min.get();
	var t_del = self.t_del.get();
	return t_min <= t_visual && (t_del == -1 || t_visual < t_del);
    };

    // Useful for selecting visuals
    self.isWithinBox = function(time, top, right, bottom, left) {
	throw Error("Visual.isWithinBox() needs to be overridden by child"
		      + "class");
    };
    
    // Shift the visual by an amount (of time), including transforms
    self.shift = function(amount) {
	self.t_min.increment(amount);
	
        if (self.t_del.get() != -1) {
            self.t_del.increment(amount);
        }

        var prop_trans_iter = self.property_transforms.iterator();
        while (prop_trans_iter.hasNext()) {
            var prop_trans = prop_trans_iter.next();
            prop_trans_iter.t.increment(amount);
        }

        var spat_trans_iter = self.spatial_transforms.iterator();
        while (spat_trans_iter.hasNext()) {
            var spat_trans = spat_trans_iter.next();
            spat_trans.t.increment(amount);
        }
    };
    

    var isIdentityMatrix = function(matrix) {
	for (var i = 0; i < matrix.length; i++) {
	    var row = matrix[i];
	    for (var j = 0; j < row.length; j++) {
		if (i == j) {
		    if (row[j] !== 1) {
			return false;
		    }
		} else {
		    if (row[j] !== 0) {
			return false;
		    }
		}
	    }
	}
	return true;
    };
    
    self.applyTransformToContext = function(context, t_vis) {
	var index = self.spatial_transforms.getIndexByTime(t_vis);
	var start_transform = self.spatial_transforms.valueAt(index);
	var final_matrix;
	if (index + 1 == self.spatial_transforms.getLength()) {
	    // There are no later transforms to interpolate with,
	    // so the transform should be the same as the starting transform
	    final_matrix = start_transform.matrix.get();
	} else {
	    var end_transform = self.spatial_transforms.valueAt(index + 1);
	    final_matrix = start_transform.interpolate(end_transform, t_vis);
	}
	if (!isIdentityMatrix(final_matrix)) {
	    context.save();
	    context.font = "50px serif";
	    context.transform(
		final_matrix[0][0], final_matrix[0][1],
                final_matrix[1][0], final_matrix[1][1],
                final_matrix[0][2], final_matrix[1][2]
            );
	    return true;
        }
	return false;
    };

    return self;
};
Visual.saveToJSON = function() {
    var json_object = {
        type: this.type.get(),
        t_del: this.t_del.get(),
        property_transforms: getArrayJSON(this.property_transforms),
	spatial_transforms: getArrayJSON(this.spatial_transforms),
        t_min: this.t_min.get(),
        properties: this.properties.saveToJSON()
    };

    return json_object;
};
Visual.loadFromJSON = function(json_object) {

    var new_visual = null;

    // Initialize the child part
    switch (json_object.type) {
        case Visual.TYPES.stroke:
            new_visual = StrokeVisual.loadFromJSON(json_object);
            break;
        case Visual.TYPES.dot:
            // TODO
            break;
        case Visual.TYPES.img:
            // TODO
            break;
        default:
            console.error('unrecognized type: '+json_object.type);
    };

    if (!new_visual) {
        console.error('no visual loaded from JSON');
    };

    // Load the parent part (don't need to set type, tMin, properties)
    new_visual.t_del.set(json_object.t_del);

    var loaded_prop_trans = [];
    for (var i = 0; i < json_object.property_transforms.length; i++) {
        loaded_prop_trans.push(VisualPropertyTransform.loadFromJSON(
	    json_object.property_transforms[i]));
    };
    new_visual.property_transforms.set(loaded_prop_trans);

    var loaded_spat_trans = [];
    for (var i = 0; i < json_object.spatial_transforms.length; i++) {
        loaded_spat_trans.push(VisualSpatialTransform.loadFromJSON(
	    json_object.spatial_transforms[i]))
    };
    new_visual.spatial_transforms(loaded_spat_trans);

    return new_visual;
};
Visual.TYPES = {
    stroke: "stroke",
    dot: "dot",
    img: "image",
    slide: "slide",
    none: "none"
};
