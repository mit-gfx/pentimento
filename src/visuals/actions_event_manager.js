"use strict";
var ActionsEventManager = function(lecture) {
    var self = EventManager().initializeEvents({
	property_change: "property_change",
	add_slide: "add_slide",
	delete_visuals: "delete_visuals",
	delete_slide: "delete_slide",
    });
    
    // Modify fireEvent to automatically add .t to the args
    self.defaultFireEvent = self.fireEvent;
    self.fireEvent = function(event_type, args) {
	var aud_t = lecture.timer.current_time.get();
    	args.vis_t = lecture.retimer.getVisualTime(aud_t);
	args.recording = lecture.is_recording.get();
	return self.defaultFireEvent(event_type, args);
    };

    var GENERAL_ACTION_CLASS = "visuals-action";
    var CHANGE_VALUE_CLASS = "property-change";
    var PROPERTY_NAMES = {
	change_width: "width",
	change_color: "color",
    change_type: "type"
    };

    var dashesToUnderscores = function(str) {
	return str.replace(/-/g, "_");
    };

    $("." + GENERAL_ACTION_CLASS).click(function(e) {
	var action = dashesToUnderscores($(this).attr("id"));
	self.fireEvent(self.EVENT_TYPES[action], {});
    });
    $("." + CHANGE_VALUE_CLASS).change(function(e) {
	var action = dashesToUnderscores($(this).attr("id"));
	var val = $(this).val();
	self.fireEvent(self.EVENT_TYPES.property_change,
		  {value: val, name: PROPERTY_NAMES[action]});
    });

    return self;
};
