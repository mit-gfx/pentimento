"use strict";
var VisualsSelectionView = function(selection) {

    //TODO: there should probably be two aspects of the rendering:
    // The bounding box, and the differentiation of visuals. The bounding box
    // should be done here, and the selection should maybe have attributes that
    // indicate where the bounding box is. The visuals should have a "selected"
    // attribute and use that to render themselves differently when selected.
    // The only question then is how to update the bounding box when a selected visual
    // doesn't fall within the bounding box for some reason, such as undo operations.
    self.renderSelection = function() {
	//TODO
	// Bounding box should move with selected visuals, say if the selected visuals
	// are moved and then that move is undone.
    };


};
    
