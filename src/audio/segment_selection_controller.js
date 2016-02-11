"use strict";
var SegmentSelection = function() {
    var self = {};

    var selection = Accessor([]);
    SegmentSelectionView(selection);

    self.get = selection.get;
    self.getIterator = selection.iterator;

    self.has = function(segment_id) {
	return selection.indexOf(segment_id) >= 0;
    }

    self.add = function(segment_id) {
	if (segment_id == null) {
	    throw Error("Can't add " + segment_id + " to selection");
	}
	selection.push(segment_id);
    };

    self.remove = function(segment_id) {
	selection.removeValue(segment_id);
    };

    self.clear = function() {
	selection.set([]);
    };
    
    return self;
};
//TODO: separate files
var SegmentSelectionView = function(selection) {
    var SELECTED_CLASS = "focus";
    
    var render = function() {
	$("." + SELECTED_CLASS).removeClass(SELECTED_CLASS);
	
	var seg_id_iter = selection.iterator();
	while (seg_id_iter.hasNext()) {
	    var id = seg_id_iter.next();
	    $("#" + id).addClass(SELECTED_CLASS);
	}
    }

    selection.addEventListener(render);
};
