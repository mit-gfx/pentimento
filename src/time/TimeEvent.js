"use strict";
/**
 * Creates time events
 */
var TimeEvent = function(time, event, pointer/index) {
    var self = {};
    self.t = TimeManager.getVisualManager().createInstance(time);

    /**
     * saveToJson method used in subclasses
     * attributes: a list of strings indicating the names of the attributes of event that need to be saved
     */
    self.saveToJson = function(attributes) {
        var json_object = {};
        for ( var attribute in attributes) {
            json_object.attribute = event[attribute].get();
        };
        json_object.t = self.t.get();
        return json_object;
    };


    // // Returns the properties at the given time (non-interpolated)
    // self.getPropertiesAtTime = function(time) {
    //     var result = new VisualProperties(self.properties.color.get(),
    //     self.properties.width.get());

    // var iter = self.property_transforms.iterator();
    // while (iter.hasNext()) {
    //     var transform = iter.next();
    //     if (transform.t.get() < time) {
    //     var name = transform.property_name.get();
    //     var value = transform.value.get();
    //     result[name].set(value);
    //         } else {
    //             break;
    //         }
    //     }
    //     return result;
    // };
    
    self.getAtTime = function(time) {

    }

    return self;
};


TimeEvent.loadFromJSON = function(json_object) {
    var visualPropertyTransform = VisualPropertyTransform(
    VisualProperty.loadFromJSON(json_object.property_name,
                    json_object.value,
                    json_object.t));
    return visualPropertyTransform;
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
