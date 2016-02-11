"use strict";
//TODO: could potentially migrate a vertex to have a tMin and a tDeletion
var Vertex = function(myX, myY, myT, myP) {
    if (myP == null) {
	myP = -1;
    }
    
    var self = {};
    self.x = Accessor(myX);
    self.y = Accessor(myY);
    self.t = TimeManager.getVisualManager().createInstance(myT);
    self.p = Accessor(myP);

    // Returns a boolean indicating whether the vertex is visible at the given
    // time
    self.isVisible = function(t_visual) {
        return self.t.get() <= t_visual;
    };

    // Saving the model to JSON
    self.saveToJSON = function() {
        var json_object = {
            x: self.x.get(),
            y: self.y.get(),
            t: self.t.get(),
            p: self.p.get()
        };

        return json_object;
    };
    
    return self;
};
Vertex.loadFromJSON = function(json_object) {
    return Vertex(json_object.x, json_object.y, json_object.t,
		      json_object.p);
};
