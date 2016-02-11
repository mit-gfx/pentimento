"use strict";
var ThumbnailController = function(thumbnail, parent_id, timeline) {
    var view = ThumbnailView(thumbnail, parent_id, timeline);

    thumbnail.t_max.addEventListener(view.updateSize);
    thumbnail.t_min.addEventListener(view.updateSize);

    // We don't ever expect a thumbnail to be re-activated, so any
    // changes to .deactivated is deactivation.
    thumbnail.deactivated.addEventListener(view.deactivate);
};
