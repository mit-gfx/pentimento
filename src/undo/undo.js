//TODO: group titles
//TODO: think about cases where methods on stack refer to things that no longer exist. Is this possible, or will the things
// be re-created before getting to that point on the stack?
//TODO: API/HowTo PAGE

var getUndoManager = function(groupTypes, debug) {
    'use strict';

    if (isUndefined(debug)){
        debug = false; // keeps track of whether debug mode is on or off
    } 

    var suppressWarnings = false; // if true, don't show debug warnings

    // Used to display a warning in the console, but only if debug mode is on.
    // msg - the message to display in the warning
    // The console text will read "WARNING: " followed by msg.
    var displayDebugWarning = function(msg) {
        if (debug && !suppressWarnings) {
            console.log("WARNING: " + msg);
        }
    }

    // the group titles are the same as the group types by default. These can be changed with the setGroupTitle function.
    var groupTitles = {};
    for (var i in groupTypes) {
        groupTitles[groupTypes[i]] = groupTypes[i];
    }

    // These stacks hold objects that represent the actions that can be undone or redone.
    // The objects, referred to as action objects later on, should have the following properties:
    //      action - the function that will be called when the action object is pulled off one of the stacks
    //      title - the text that will be used in the GUI to describe this action 
    //      inGroups - an array of the hierarchy levels that the action was performed within
    //      atStartOfGroups - the groups that were started right before this action was performed
    //      atEndOfGroups - the groups that were ended right after this action was performed
    var undoStack = [];
    var redoStack = [];

    // used to tell if the undoManager is currently undoing or redoing (or neither)
    var undoing = false;
    var redoing = false;

    var addToStart = false;

    var openGroups = []; // groups that have been started, but not ended
    var groupsJustStarted = []; // a group is 'just started' after it has been started and before any actions are performed

    var hierarchyOrder = []; // keeps track of the order groups are started in, to help prevent overlapping groups

    var group; // used in a few for loops. Increased scope to prevent it having to be created and destroyed many times.

    // Holds the subscribed listeners for each event type. The keys are the valid event types.
    var listeners = {
        groupStatusChange: [],
        operationDone: [],
        actionDone: []
    };

    // Calls all the listeners subscribed to the specified event type.
    var fireEvent = function(type) {
        if (!(type in listeners)) {
            throw invalidEventTypeError(type);  
        }
        // iterate through and call each listener subscribed to this event type
        for (var i = 0; i < listeners[type].length; i++) {
            try {
		listeners[type][i]();
	    } catch(e) {
		console.error(e.stack);
	    }
        }
    };

    // returns the next action object that can be undone
    var getNextUndo = function() {
        if (undoStack.length > 0) {
            return undoStack[undoStack.length-1];
        }
        return null;
    };
    
    // returns the next action object that can be redone
    var getNextRedo = function() {
        if (redoStack.length > 0) {
            return redoStack[redoStack.length-1];
        }
        return null;
    };

    // Returns the title that should go on a group undo button.
    // If all the actions in the group have the same title, that title is returned. 
    // Otherwise, the group's name is returned.
    // group - the name of the group to get the undo title for
    var getGroupUndoTitle = function(group) { //TODO: tests
        if (undoStack.length <= 0 || getNextUndo().atEndOfGroups.indexOf(group) === -1) {            
                return group;
        }   

        var title = null;
        var index = undoStack.length-1;
        var atStart = false;
        // iterate through each action in the group
        while (!atStart) {
            if (index < 0 || index >= undoStack.length) {
                throw indexOutOfBoundsError(index); //TODO: test
            }
            if (undoStack[index].inGroups.indexOf(group) === -1) {
                throw notInGroupError(group); //TODO: test
            }
            if (isNull(title)) {
                title = undoStack[index].title; // set the title if it hasn't been set yet
            }
            else if (undoStack[index].title != title) {
                title = groupTitles[group]; // if the titles aren't the same, return the default group title
                break;
            }
            if (undoStack[index].atStartOfGroups.indexOf(group) !== -1) {
                atStart = true; // the start of the group has been reached, can stop iterating
            }
            index--;
        }
        return title;
    };

    // Returns the title that should go on a group redo button.
    // If all the actions in the group have the same title, that title is returned. 
    // Otherwise, the group's name is returned.
    // group - the name of the group to get the redo title for
    var getGroupRedoTitle = function(group) { //TODO: tests, combine with getGroupUndoTitle?
        if (redoStack.length <= 0 || getNextRedo().atStartOfGroups.indexOf(group) === -1) {
                return null;
        }   

        var title = null;
        var index = redoStack.length-1;
        var atEnd = false;

        // iterate through each action in the group
        while (!atEnd) {
            if (index < 0 || index >= redoStack.length) {
                displayDebugWarning("While getting title, couldn't find end of group: " + group);
                return title;
            }
            if (redoStack[index].inGroups.indexOf(group) === -1) {
                throw notInGroupError(group); //TODO: test
            }
            if (isNull(title)) {
                title = redoStack[index].title; // set the title if it hasn't been set yet
            }
            else if (redoStack[index].title != title) {
                title = groupTitles[group]; // if the titles aren't the same, return the default group title
                break;
            }
            if (redoStack[index].atEndOfGroups.indexOf(group) !== -1) {
                atEnd = true; // the start of the group has been reached, can stop iterating
            }
            index--;
        }
        return title;
    };

    // Undoes the last action that was added to the undo stack.
    // hierMode - a boolean that is true when called from within a hierarchy-related function, should be falsy otherwise
    var undo = function(hierMode) {
        if (undoStack.length === 0) {
            throw undoError();
        }

        undoing = true;

        // remove any groups started, but not populated, right before the undo
        for (var i in groupsJustStarted) {
            group = groupsJustStarted[i];
            var index = openGroups.indexOf(group);
            if (index !== -1) {
                unorderedSplice(openGroups, index, 1);
                index = hierarchyOrder.indexOf(group); // if group was in openGroups, should also be removed from hierarchyOrder
                hierarchyOrder.splice(index, 1);
                // group effectively ended, fire event and debugWarning about autoClosed
                fireEvent('groupStatusChange');
                displayDebugWarning(groupAutoClose(group));
            }

        }

        

        var actionObj = undoStack.pop();
        actionObj.action(); // undoes the performed action

        groupsJustStarted = actionObj.atStartOfGroups.slice(0);

        // the relevant action object is now on the redo stack, but some properties haven't been defined yet.
        // they should be the same as they were before the action was undone.
        var nextRedo = getNextRedo();
        if (!nextRedo) {
            throw improperInverseError();
        }
        nextRedo['title'] = actionObj.title;
        nextRedo['inGroups'] = actionObj.inGroups;
        nextRedo['atStartOfGroups'] = actionObj.atStartOfGroups;
        nextRedo['atEndOfGroups'] = actionObj.atEndOfGroups;

        // If the end of a group has been individually undone, label the action before it as the end of the group.
        // This way, if the group is undone and redone, the group will be exactly the way it was before the group was undone.
        var nextUndo = getNextUndo();
        if (!hierMode && !isNull(nextUndo)) {
            for (var i in actionObj.atEndOfGroups) { // loop over all the groups that ended with the undone action
                group = actionObj.atEndOfGroups[i];
                if (actionObj.atStartOfGroups.indexOf(group) === -1) { // make sure it wasn't the start of the group
                    nextUndo.atEndOfGroups.push(group);
                }
            }
        }

        undoing = false;
        fireEvent('operationDone');
        
        return publicFunctions;
    };

    // Redoes the last action added to the redo stack.
    // hierMode - a boolean that is true when called from within a hierarchy-related function, should be falsy otherwise
    var redo = function(hierMode) {
        if (redoStack.length <= 0) {
            throw redoError();
        }
        if (!hierMode && getNextRedo().atStartOfGroups.length > 0) {
            throw redoError(); // can't individually redo the start of a group, must redo the entire group
        };

        redoing = true;

        groupsJustStarted = [];

        var initialNextUndo = getNextUndo();

        var actionObj = redoStack.pop();
        actionObj.action(); // redoes the undone action

        // The relevant action object is now on the undo stack, but some properties were defined as if the action were
        // initially performed in the undoManager's current state. Instead, the properties should be the same as they were
        // before the action was redone.
        var currentNextUndo = getNextUndo();
        currentNextUndo.inGroups = actionObj.inGroups.slice(0);
        currentNextUndo.atStartOfGroups = actionObj.atStartOfGroups.slice(0);
        currentNextUndo.atEndOfGroups = actionObj.atEndOfGroups.slice(0);         

        // fixing some grouping things

        if (initialNextUndo) {
            // backwards for-loop to avoid indexing problems with splicing
            for (var i = initialNextUndo.atEndOfGroups.length-1; i >= 0; i--) {
                group = initialNextUndo.atEndOfGroups[i];
                // if the action just redone is supposed to be in a group with initialNextUndo 
                // and initialNextUndo is currently the end of that group, the newly redone action
                // should be made the end of the group instead
                if (initialNextUndo.atEndOfGroups.indexOf(group) !== -1 && currentNextUndo.inGroups.indexOf(group) !== -1 && 
                    currentNextUndo.atStartOfGroups.indexOf(group) === -1) {
                        unorderedSplice(initialNextUndo.atEndOfGroups, i, 1);
                        if (currentNextUndo.atEndOfGroups.indexOf(group) === -1) { // make sure to not list the group twice
                            currentNextUndo.atEndOfGroups.push(group);
                        }
                        
                }
            }
        }

        // update the open groups to be those that the redone action is in
        // this results in the closing of any groups that were opened, but not populated, right before the redo

        // display autoclose warnings
        for (var i in openGroups) {
            group = openGroups[i];
            displayDebugWarning(groupAutoClose(group));
        }

        // close all groups
        openGroups = [];

        // reopen the appropriate groups
        for (var i in actionObj.inGroups) {
            group = actionObj.inGroups[i];
            if (currentNextUndo.atEndOfGroups.indexOf(group) === -1) { // don't add the group if it ends at the redone action
                displayDebugWarning(groupReopened(group));
                openGroups.push(group);
            }
        }

        
        redoing = false;    
        fireEvent('operationDone');

        return publicFunctions;
    };

    // Holds the public functions of the undoManager, will be returned at the end of this getUndoManager() function
    // For chaining opportunities, the 'that' object is returned in any of these functions that wouldn't otherwise return anything.
    var publicFunctions = {

        // Adds an action to the undo stack or the redo stack, depending on what mode the undoManager is in.
        // inverse: the function that would undo the actions just performed
        // title: describes the actions just performed   
        add: function(inverse, title) {
            if (!title) {
                title = "";
            }
            if (undoing) { // if undoing, the action object should go on the redo stack
                redoStack.push({
                    action: inverse
                    // the title, inGroups, atStartOfGroups, and atEndOfGroups properties will be
                    // added before the end of the undo process, just not in this function.
                });
            }
            else { // if redoing or just performing an action, the action object should go on the undo stack
		if (addToStart) {
		    publicFunctions.addToStartOfGroup(addToStart, inverse);
		} else {
                    undoStack.push({
			action: inverse,
			title: title,
			inGroups: openGroups.slice(0),
			atStartOfGroups: groupsJustStarted.slice(0),
			atEndOfGroups: [] // will be changed later, if a group is ended right after this action
                    });
		}

                if (!redoing) {
                    redoStack = []; // can't redo anything after performing a new action

                    fireEvent('actionDone');
                }

                

            }
            groupsJustStarted = []; // an action happened, so the groups are no longer 'just started'
            return publicFunctions;
        },
        // Opens a group/hierarchy level
        // group - the name of the particular group that should be started
        startHierarchy: function(group) {
            // if the group has already been started, automatically end it and start a new one
            if (openGroups.indexOf(group) !== -1) {
                publicFunctions.endHierarchy(group);
                displayDebugWarning(groupAutoClose(group));
            }

            // keep track of the fact that the group was started
            hierarchyOrder.push(group);
            openGroups.push(group);
            groupsJustStarted.push(group);

            fireEvent("groupStatusChange");

            return publicFunctions;
        },
        // Closes a group/hiearchy level
        // group - the name of the particular group that should be ended
        endHierarchy: function(group) {
            // make sure the group has been started
            var groupOpen = false;
            var nextUndo = getNextUndo();
            if (nextUndo) {
                if (nextUndo.inGroups.indexOf(group) !== -1 && nextUndo.atEndOfGroups.indexOf(group) === -1) {
                    groupOpen = true;
                }
            }
            if (!groupOpen && openGroups.indexOf(group) !== -1) {
                groupOpen = true;
            }
            if (!groupOpen) {
                throw groupEndError(group);
            }
            // if closing this group would result in overlapping groups, automatically close the inner groups as well.
            // (e.g. start1 start2 end1 end2 would be considered overlapping, it should be start1 start2 end2 end1 instead )
            var index = hierarchyOrder.indexOf(group);
            if (index !== -1) {
                if (index+1 < hierarchyOrder.length) {
                    var innerGroup = hierarchyOrder[index+1];
                    publicFunctions.endHierarchy(innerGroup); // will recursively end the groups from innermost to outermost
                    displayDebugWarning(groupAutoClose(innerGroup));
                }
                hierarchyOrder.pop(); //the group should be at the end of hierarchyOrder by this point, can pop it instead of splicing
            }
            else {
                displayDebugWarning("The group '"+group+"' is not in hierarchyOrder, although it appears to be started.");
            }
            index = groupsJustStarted.indexOf(group);
            if (index === -1) {
                // keep track of the fact that the group was ended
                var i = openGroups.indexOf(group);
		if (i >= 0) {
                    unorderedSplice(openGroups, i, 1);
		}
                getNextUndo().atEndOfGroups.push(group);
                // event only fired for non-empty groups
                fireEvent("groupStatusChange");
            }
            else {
                // the group was empty, so it is effectively closed without adding anything to the stack
                unorderedSplice(groupsJustStarted, index, 1);
                unorderedSplice(openGroups, index, 1);
            }          
            return publicFunctions;
        },
        // Undoes everything up to the start of the group, but only if the first action to be undone is part of the group.
        // group - the name of the particular group that should be undone
        undoHierarchy: function(group) {
            // make sure the first action to be undone is part of the group
            if (undoStack.length <= 0 || getNextUndo().inGroups.indexOf(group) === -1) {
                throw groupUndoError(group);
            }
            // if the group hasn't been ended yet, automatically do so
            if (getNextUndo().atEndOfGroups.indexOf(group) === -1) {
                publicFunctions.endHierarchy(group);
                //TODO: should there be a warning here? I think this action is more expected that the others.
            }
            // undo each action until the start of the group is reached
            var reachedStart = false;
            while (!reachedStart) {
                if (getNextUndo().atStartOfGroups.indexOf(group) !== -1) {
                    reachedStart = true;
                }
                undo(true);
            }
            // Undoing the group may have undone part of other groups, which may or may not still be open.
            // Add the groups that weren't open to atEndOfGroups of the next undo action.
            var nextUndo = getNextUndo();
            if (nextUndo) {
                for (var i in nextUndo.inGroups) {
                    group = nextUndo.inGroups[i];
                    if (hierarchyOrder.indexOf(group) === -1) { // if the group isn't in hierarchyOrder, then it should be ended
                        nextUndo.atEndOfGroups.push(group);
                    }
                }
            }
            fireEvent('operationDone');
            return publicFunctions;
        },
	undoLastHierarchy: function() {
	    if (undoStack.length <= 0) {
		throw groupUndoError("last group");
	    }
	    var group;
	    if (getNextUndo().atEndOfGroups.length !== 0) {
		group = getNextUndo().atEndOfGroups[0];
	    } else if (getNextUndo().inGroups.length !== 0) {
		group = getNextUndo().inGroups[0];
	    } else {
		throw groupUndoError("last group");
	    }
	    return publicFunctions.undoHierarchy(group);
	},
	// Redoes the group such that it is exactly the way it was right before it was undone, (i.e. if part
        // of the group was individually undone before the group was undone as a whole, that part will not 
        // appear after redoing the group), but only if the first action to be redone is part of the group. 
        // group - the name of the particular group that should be redone
        redoHierarchy: function(group) {
            //make sure the first action to be redone is part of the group
            if (redoStack.length <= 0 || getNextRedo().atStartOfGroups.indexOf(group) === -1) {
                throw groupRedoError(group);
            }

            // redo each action until the end of the group (as it was before the group was undone) is reached
            var reachedEnd = false;
            while (!reachedEnd) {
                if (!getNextRedo()) {
                    displayDebugWarning("While redoing the hierarchy, couldn't find the end of group: " + group);
                    reachedEnd = true
                }
                else {
                    if (getNextRedo().atEndOfGroups.indexOf(group) !== -1) {
                        reachedEnd = true;
                    }
                    redo(true);
                }
            }

            fireEvent('operationDone');
            return publicFunctions;
        },
	redoLastHierarchy: function() {
	    if (redoStack.length <= 0) {
		throw groupRedoError("last group");
	    }
	    var group;
	    if (getNextRedo().atStartOfGroups.length !== 0) {
		group = getNextRedo().atStartOfGroups[0];
	    } else if (getNextRedo().inGroups.length !== 0) {
		group = getNextRedo().inGroups[0];
	    } else {
		throw groupRedoError("last group");
	    }
	    return publicFunctions.redoHierarchy(group);
	},
        // Returns the keys of the listeners object.
        // These keys represent the different types of events a listener can subscribe to.
        getEventTypes: function() {
            var eventTypes = [];
            for (var type in listeners) {
                eventTypes.push(type);
            }
            return eventTypes;
        },
        // Adds a listener for the given event type.
        // Returns true if the listener is added successfully
        // eventType - the type of event that the listener should be called for
        // listener - a function that takes the event as a parameter
        addListener: function(eventType, listener) {
            if (!(eventType in listeners)) {
                throw invalidEventTypeError(eventType);
            }
            listeners[eventType].push(listener);
            return true;
        },
        // Removes a listener for the given event type.
        // Returns true if the listener is successfully removed.
        // eventType - the type of event that the listener was subscribed to
        // listener - the function that was subscribed
        removeListener: function(eventType, listener) { //TODO: test
            if (!(eventType in listeners)) {
                throw invalidEventTypeError(eventType);
            }
            var index = listeners[eventType].indexOf(listener); 
            if (index === -1) {
                throw listenerNotSubscribedError();
            }
            unorderedSplice(listeners[eventType], index, 1);
            return true;
        },
        // Switches the debug mode.
        // Returns a boolean indicating if it is now in debug mode.
        toggleDebugMode: function() {
            debug = !debug;
            return debug;
        },
        // Limits the undo and redo stacks to a certain number of operations.
        // maxLength - the length that the stacks should not exceed. When an operation pushes a stack past this length, 
        // the oldest operation will be dropped.
        setStackLimit: function(maxLength) {
            //TODO

            //TODO: lots of edge cases! (don't cut groups in half, etc)
        },
        // Returns a boolean indicating if the specified group is currently open.
        isGroupOpen: function(group) {
            return (openGroups.indexOf(group) !== -1);
        },
        // Checks if the undoManager can currently perform the undo function for a particular group. 
        // group - specifies the group the undo function applies to. If undefined (or otherwise falsy), 
        // will check for the individual undo function.
        // Returns false if the undo function cannot be applied, returns the title of the group/action if it can.      
        canUndo: function(group) {
            //TODO: test
            if (undoStack.length <= 0) {
                return false;
            }
            if (!group) {
                return getNextUndo().title;
            }
            if (getNextUndo().inGroups.indexOf(group) !== -1) {
                return getGroupUndoTitle(group);
            }
            return false;
        },
        // Checks if the undoManager can currently perform the redo function for a particular group. 
        // group - specifies the group the redo function applies to. If undefined (or otherwise falsy), 
        // will check for the individual redo function.  
        // Returns false if the redo function cannot be applied, returns the title of the group/action if it can.      
        canRedo: function(group) {
            if (redoStack.length <= 0) {
                return false;
            }
            if (!group) {
                return getNextRedo().title;
            }
            if (getNextRedo().atStartOfGroups.indexOf(group) !== -1) {
                return getGroupRedoTitle(group);
            }
            return false;
        },
        // Stops the undoManager from adding actions to the stacks. If a new action is performed or an old action is 
        // redone while the undoManager is suspended, it cannot be undone. If an old action is undone while the 
        // undoManager is suspended, it cannot be redone.
        suspend: function() {
            //TODO
        },
        // Allows the undoManager to continue adding actions to the stacks.
        resume: function() {
            //TODO
        },
        // Returns a boolean indicating whether the undoManager is currently suspended or not.
        isSuspended: function() {
            //TODO
        },
        // Adds to the action at the beginning of the group on the undoStack, if the group is currently open.
        // group - the name of the group that started with the action that will be added to.
        // addendum - the method to concatenate with the already existing action.
        // Returns true if successfully added.
        addToStartOfGroup: function(group, addendum) {
	    if (undoing || groupsJustStarted.indexOf(group) >= 0) {
		return publicFunctions.add(addendum);
	    }
            if (undoStack <= 0) {
                //TODO: error
            }
            if (getNextUndo().inGroups.indexOf(group) === -1) {
                //TODO error
            }
            var index = undoStack.length-1;
            while(undoStack[index].atStartOfGroups.indexOf(group) === -1) {
                index--;
            }
	    var inGroups = undoStack[index].inGroups.slice();
	    index++;
	    var sameArrayElems = function(arr1, arr2) {
		if (arr1.length != arr2.length) {
		    return false;
		}
		for (var i = 0; i < arr1.length; i++) {
		    if (arr2.indexOf(arr1[i]) < 0) {
			return false;
		    }
		}
		return true;
	    };
	    while(true) {
		if (index >= undoStack.length) {
		    break;
		}
		if (sameArrayElems(inGroups, undoStack[index].inGroups)) {
		    index++;
		} else {
		    break;
		}
	    }
	    var actionObj = {
		action: addendum,
		atStartOfGroups: [],
		atEndOfGroups: [],
		inGroups: inGroups
	    };
	    var end_index = undoStack[index-1].atEndOfGroups.indexOf(group);
	    if (end_index >= 0) {
		undoStack[index-1].atEndOfGroups.splice(end_index, 1);
		actionObj.atEndOfGroups.push(group);
	    }
	    undoStack.splice(index, 0, actionObj);
            return true;
        },
	// If group is falsy, turns the mode off.
	addToStartMode: function(group) {
	    addToStart = group;
	},
        // returns the length of the undo stack
        getUndoLength: function() {
            return undoStack.length;
        },
	isGroupOpen: function(group) { return openGroups.indexOf(group) >= 0; },
        // returns the length of the redo stack
        getRedoLength: function() {
            return redoStack.length;
        },
        // returns the title of the next action to be undone
        getUndoTitle: function() {
            if (undoStack.length > 0) {
                return getNextUndo().title;
            }
            return null;
        },
        // returns the title of the next action to be redone
        getRedoTitle: function() {
            if (redoStack.length > 0) {
                return getNextRedo().title;
            }
            return null;
        },
        // set the default title of a group
        setGroupTitle: function(group, title) {
            var index = groupTypes.indexOf(group);
            if (index === -1) {
                throw notGroupError(group);
            }
            groupTitles[group] = title;
            return true;
        },
        // Switches the (boolean) value of suppressWarnings and returns the new value.
        // (if suppressWarnings is true, debug messages will not be shown)
        toggleWarningSuppression: function() {
            suppressWarnings = !suppressWarnings;
            return suppressWarnings;
        }
    };

    if (debug) {
        publicFunctions['undo'] = undo;
        publicFunctions['redo'] = redo;
    }
    
    return publicFunctions;  // return the public functions
};


// TODO debugger - when group gets renamed
// option to set title when creating a group <-- this might change the get group title functions
