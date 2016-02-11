"use strict";

///////////////////////////////////////////////////////////////////////////////
// Main: The single entry point for the entire application
///////////////////////////////////////////////////////////////////////////////

// Globals
var undoManager;

// Create the lecture when everything is loaded
$(document).ready(function() {
    undoManager = getUndoManager([], true);
    LectureModel();
});
