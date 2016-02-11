"use strict";
var ThumbnailsView = function(thumbnails) {
    var $thumbnails = $("#" + thumbnails.getID())
	.css("height", ThumbnailsView.HEIGHT);
};
ThumbnailsView.HEIGHT = 100;
ThumbnailsView.PAST_COLOR = "#DDDDDD"; // Color to draw older visuals in

