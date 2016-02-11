"use strict";
var LectureView = function() {
    var self = {};

    var DISABLED_CLASS = "disabled";   

    var $undo = $("#" + LectureView.IDS.undo);
    var $redo = $("#" + LectureView.IDS.redo);

    var $help_dialog = $("#" + LectureView.IDS.help_dialog)
	.dialog({
            title: "Guide",
            modal: true, 
            draggable: false,
            resizable: false,
            minWidth: 600
	}).dialog('close');

    self.updateUndoButtons = function(can_undo, can_redo) {
	if (can_undo) {
	    $undo.removeClass(DISABLED_CLASS);
	} else {
	    $undo.addClass(DISABLED_CLASS);
	}

	if (can_redo) {
	    $redo.removeClass(DISABLED_CLASS);
	} else {
	    $redo.addClass(DISABLED_CLASS);
	}	    
    };

    self.showHelpDialog = function() {
	$help_dialog.dialog("open");
    };
    
    return self;
};
//TODO: these elements should be initially created in this view too.
LectureView.IDS = {
    undo: "undo",
    redo: "redo",
    help_dialog: "help-dialog",
    help_button: "help-button"
};
