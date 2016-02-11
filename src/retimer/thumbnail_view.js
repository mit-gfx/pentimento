"use strict";
var ThumbnailView = function(thumbnail, parent_id, timeline) {    
    var self = {};
    
    var $thumbnail = $("<canvas>")
	.attr("id", thumbnail.getID())
	.attr("class", ThumbnailView.CLASS);
    $("#" + parent_id).append($thumbnail);
    
    self.updateSize = function() {
	var width = timeline.audioTimeToPixels(thumbnail.getDuration());
	$thumbnail.attr("width", width)
	    .attr("height", ThumbnailsView.HEIGHT);
    }
    
    self.deactivate = function() {
	if (thumbnail.deactivated.get()) {
	    $thumbnail.remove();
	}
    };

    return self;
};
ThumbnailView.CLASS = "thumbnail";
