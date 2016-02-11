"use strict";
var AudioEventManager = function() {
    var self = EventManager().initializeEvents({
	delete_segments: "delete_segments",
	insert_track: "insert_track",
	delete_track: "delete_track",
	change_track: "change_track"
    });

    var ids_to_events = {};
    for (var key in self.EVENT_TYPES) {
	ids_to_events[AudioView.IDS[key]] = self.EVENT_TYPES[key];
    }
    
    var clickHandler = function(e) {
	var event_type = ids_to_events[$(e.target).attr("id")];
	var event_args = {};

	if (event_type === self.EVENT_TYPES.change_track) {
	    event_args.track_num = parseInt($(e.target).val());
	};
	
	if (event_type != null) {
	    self.fireEvent(event_type, event_args);
	}
    };
    $("#" + AudioView.IDS.controls).click(clickHandler);

    return self;
};
