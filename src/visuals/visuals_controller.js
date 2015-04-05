//Because of integration with the undo manager, the undo actions should call updateVisuals()
//appropriately. Only the undo actions, though, not the forward actions! Therefore, any time
//um.add is called, it should have an updateVisuals inside of the function if necessary
"use strict";

var VisualsController = function(visuals_model) {
    var self = this;
    var visualsModel = null;
    var toolsController = null;
    var renderer = null;

    // Variables used for recording
    var originSlide = null;
    var originSlideDuration = null;
    var shiftInterval = null;
    var dirtyVisuals = [];
    var recordingBegin = NaN;
    var lastTimeUpdate = NaN;
    var visualsInsertionTime = NaN;

    // DOM elements
    var canvasID = "sketchpad";

    this.canvas = null;
    this.context = null;

    this.tool = null; //whichever tool is active for a recording
    this.lastPoint = null;
    this.currentVisual = null;
    this.selection = [];
    this.currentSlide = null;

    this.color = '#777';
    this.width = 2;

    this.getVisualsModel = function() {
        return visualsModel;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Recording of Visuals
    //
    // Handlers for when recording begins and ends.
    // Includes helper functions for recording logic.
    ///////////////////////////////////////////////////////////////////////////////

    var beginRecording = function() {
        if (!self.currentSlide) {
            console.error("there is no current slide");
            return;
        }

        self.selection  = [];
        $('input[data-toolname="pen"]').click();
        $('.recording-tool').toggleClass('hidden');

        var duration = 0;
        var iter = self.getVisualsModel().getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            if(slide==self.currentSlide) {
                break; 
            };

            duration += slide.getDuration();
        }

        // TODO snap pentimento.timeController.getTime() leftmost
        // visualsInsertionTime is the time WITHIN the current slide at which you begin a recording
        visualsInsertionTime = pentimento.timeController.getTime() - duration;
        lastTimeUpdate = globalTime();
        recordingBegin = lastTimeUpdate;
        originSlide = self.currentSlide;
        originSlideDuration = self.currentSlide.getDuration();

        setDirtyVisuals();
    };

    var stopRecording = function() {

        self.selection  = [];
        self.tool = null;
        $('.recording-tool').toggleClass('hidden');

        var gt = globalTime();
        var diff = gt - lastTimeUpdate;
        self.currentSlide.setDuration(self.currentSlide.getDuration() + diff);
        var totalDiff = gt - recordingBegin;

        //DOES NOT add an action onto the undo stack
        cleanVisuals(dirtyVisuals, originSlide.getDuration() - originSlideDuration);

        var dummyOriginSlide = originSlide;
        var dummyOriginSlideDuration = originSlideDuration;
        var tmpVisuals = []; 
        for(var i in dirtyVisuals) { 
            tmpVisuals.push(dirtyVisuals[i].visual); 
        }
        
        // Reset recording variables
        recordingBegin = NaN;
        lastTimeUpdate = NaN;
        visualsInsertionTime = NaN
        originSlide = null;
        originSlideDuration = null;
        dirtyVisuals = [];
    };

    // this.setCurrentSlide = function(slide) {
    //     var index = slides.indexOf(slide);
    //     if (index < 0) {
    //         return;
    //     };
    //     self.currentSlide = slide;
    // };

    // this.getCurrentSlide = function() {
    //     return self.currentSlide;
    // };

    // Sets the current slide to be at the given time
    this.setCurrentSlideAtTime = function(time) {
        if (time==0) { 
            self.currentSlide = visualsModel.getSlides()[0];
            return;
        };
        var totalDuration=0;
        var slidesIter = visualsModel.getSlidesIterator();
        while(slidesIter.hasNext()) {
            var slide = slidesIter.next();
            if(time > totalDuration && time <= totalDuration+slide.getDuration()) {
                self.currentSlide = slide;
                return;
            } else {
                totalDuration += slide.getDuration();
            }
        }
    };

    var setDirtyVisuals = function() {
        var iter = self.currentSlide.getVisualsIterator();
        while(iter.hasNext()) {
            var visual = iter.next();
            if(visual.getTMin() > pentimento.timeController.getTime()) { //is dirty
                dirtyVisuals.push(self.makeVisualDirty(visual));
            };
        };
    };

    var makeVisualDirty = function(visual) {
        var wrapper = {};
        wrapper.visual = visual;
        wrapper.tMin = visual.getTMin();
        visual.setTMin(Number.POSITIVE_INFINITY); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER
        wrapper.times = [];
        var vertices = visual.getVertices();
        for(var i in vertices) {
            wrapper.times.push(vertices[i].getT());
            vertices[i].setT(Number.POSITIVE_INFINITY);
        };
        //would have to disable transforms
        return wrapper;
    };

    var cleanVisuals = function(dirtyWrappers, amount) {
        for(var i in dirtyWrappers) {
            var dirtyWrapper = dirtyWrappers[i];
            var visual = dirtyWrapper.visual;
            visual.setTMin(dirtyWrapper.tMin + amount);
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(dirtyWrapper.times[j] + amount);
            };
            //would have to re-enable transforms
        };
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Adding of Slides
    ///////////////////////////////////////////////////////////////////////////////

    this.addSlide = function() {
        if (!self.currentSlide) { 
            console.error('self.currentSlide missing');
            return;
        };
        var time = globalTime();
        var diff = time - lastTimeUpdate;
        lastTimeUpdate = time;
        var oldInsertionTime = visualsInsertionTime;
        var oldDirtyVisuals = dirtyVisuals;
        var prevSlide = self.currentSlide;
        var newSlide = new Slide();
        
        self.addSlide(prevSlide, newSlide); //DOES NOT add an action onto the undo stack
        prevSlide.setDuration(prevSlide.getDuration() + diff);

        self.currentSlide = newSlide;
        visualsInsertionTime = 0;
    };

    this.shiftSlideDuration = function(slide, amount) {
        slide.setDuration(slide.getDuration() + amount);
        self.shiftSlideDuration(slide, -1.0*amount);
    }
    
    //edit mode function
    this.deleteSlide = function(slide) {
        if(visualsModel.getSlides().length==1) {
            throw {name:"DeleteSlideError", message:"Only one slide left, cannot delete!"}
        }
        var index = visualsModel.getSlides().indexOf(slide);
        if(index==-1) { console.log("Error in delete_slide for visualsModel controller"); return; }

        visualsModel.getSlides().splice(index, 1);
        
        var duration = 0;
        var slideIter = visualsModel.getSlidesIterator();
        while(slideIter.hasNext()) {
            var sl = slideIter.next();
            if(slideIter.index == index) { break; }
            duration += sl.getDuration();
        }
        var slideTime = pentimento.timeController.getTime() - duration;
        pentimento.timeController.updateTime(duration); //self.setStateSlide() implicit
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Adding of Visuals
    ///////////////////////////////////////////////////////////////////////////////

    this.addVisual = function(visual) {
        //puts a visual into a coherent state given the context of the recording before passing it 
        //over to the visualsController to actually add it
        var verts = visual.getVertices();
        for(var i in verts) {
            var vert = verts[i];
            vert.setT(visualsInsertionTime + vert.getT() - lastTimeUpdate);
        }
        visual.setTMin(visualsInsertionTime + visual.getTMin() - lastTimeUpdate);
        
        if(visual.getTDeletion() != null) { 
            visual.setTDeletion(visualsInsertionTime + visual.getTDeletion() - lastTimeUpdate); 
        };
        self.currentSlide.getVisuals().push(visual);
    }

    this.appendVertex = function(visual, vertex) {
        vertex.setT(visualsInsertionTime + vertex.getT() - lastTimeUpdate);
                visual.getVertices().push(vertex);

    };

    this.addProperty = function(visual, property) {
        property.setTime(visualsInsertionTime + property.getTime() - lastTimeUpdate);
        visual.getPropertyTransforms().push(property);
    };

    this.setTDeletion = function(visuals, time) {
        for(var i in visuals) {
            var visual = visuals[i];
            var tdel = visual.getTDeletion();
            visual.setTDeletion(visualsInsertionTime + time - lastTimeUpdate);
        };
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Transforming of Visuals
    //
    // Typically during a recording, these are the handlers for transforms to be applied to visuals
    // Resizing or such actions are transformations which may happen during editing
    ///////////////////////////////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////////////////////////
    // Editing of Visuals
    //
    // This section is primarily concerned with the direct editing of the properties of
    // a visual. Recording edits to a visual are transforms, which is in a later section
    ///////////////////////////////////////////////////////////////////////////////

    this.editWidth = function(visuals, newWidth) {
        var widthObjs = [];
        for(var i in visuals) {
            var visual = visuals[i];
            var widthObj = {};
            widthObj.widthTrans = [];
            widthObj.indices = [];
            widthObj.width  = visual.getProperties().getWidth();
            visual.getProperties().setWidth(newWidth);
            var propTrans = visual.getPropertyTransforms();
            for(var j in propTrans) {
                if(propTrans[j].type=="width") {
                    widthObj.widthTrans.push(propTrans[j]);
                    widthObj.indices.push(j);
                }
            }
            for(var j in widthObj.widthTrans) {
                propTrans.splice(propTrans.indexOf(widthObj.widthTrans[j]), 1);
            }
            widthObjs.push(widthObj);
        }
    }

    this.editColor = function(visuals, newColor) {
        //TODO FILL
    }


    function doShiftVisual(visual, amount) {
        visual.setTMin(visual.getTMin() + amount);
        var vertIter = visual.getVerticesIterator();
        while(vertIter.hasNext()) {
            var vert = vertIter.next();
            vert.setT(vert.getT() + amount);
        }
        if(visual.getTDeletion()!=null) { visual.setTDeletion(visual.getTDeletion() + amount);}
        var propTransIter = visual.getPropertyTransformsIterator();
        while(propTransIter.hasNext()) {
            var propTrans = propTransIter.next();
            propTrans.setT(propTrans.getT() + amount);
        }
        var spatTransIter = visual.getSpatialTransformsIterator();
        while(spatTransIter.hasNext()) {
            var spatTrans = spatTransIter.next();
            spatTrans.setT(spatTrans.getT() + amount);
        }
    }
    
    this.shiftVisuals = function(visuals, amount) {
        if(visuals.length==0) { 
            return; 
        };
        for(var vis in visuals) { 
            doShiftVisual(visuals[vis], amount);
        };
        
        if(pentimento.DEBUG) { console.log(shift); }
    }
    
    
    this.deleteVisuals = function(visuals) {
        var indices = [];
        var segments = segmentVisuals(visuals);
        var shifts = getSegmentsShifts(segments);
        shifts.reverse();
        
        console.log("pre-DELETION visuals"); console.log(self.currentSlide.visuals);
        console.log("DELETION shifts"); console.log(shifts);
        
        for(var vis in visuals) { //remove the visuals from the slide
            var index = self.currentSlide.getVisuals().indexOf(visuals[vis]);
            self.currentSlide.getVisuals().splice(index, 1);
            indices.push(index);
            if(index==-1) { console.log('error in deletion, a visual could not be found on the slide given'); }
        }
        
        console.log("post-DELETION visuals"); console.log(self.currentSlide.getVisuals());
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            var visualIter = self.currentSlide.getVisualsIterator();
            while(visualIter.hasNext()) {
                var visual = visualIter.next();
                if(visual.getTMin() >= shift.tMin ) { doShiftVisual(visual, -1.0*shift.duration); } //visual.tMin-1.0*shift.duration
            }
        }
        shifts.reverse();
        //should we change the duration of the slide?!?

        return shifts[0].tMin;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////

    function prevNeighbor(visual) {
        var prev;
        for(vis in self.currentSlide.visuals) {
            var tMin = self.currentSlide.visuals[vis].tMin;
            if(tMin < visual.tMin && (prev==undefined || tMin > prev.tMin)) {
                prev = self.currentSlide.visuals[vis];
            }
        }
        return prev;
    }

    function nextNeighbor(visual) {
        var next;
        for(vis in self.currentSlide.visuals) {
            var tMin = self.currentSlide.visuals[vis].tMin;
            if(tMin > visual.tMin && (next==undefined || tMin < next.tMin)) {
                next = self.currentSlide.visuals[vis];
            }
        }
        return next;
    }
    
    var segmentVisuals = function(visuals) {
        //returns an array of segments, where each segment consists of a set of contiguous visuals
        var cmpVisuals = function(a, b) {
            if(a.tMin < b.tMin) {
                return -1;
            }
            if (b.tMin > a.tMin) {
                return 1;
            }
            return 0;
        }
        var cmpSegments = function(a, b) {
            //only to be used if each segment is sorted!
            if (a[0].tMin < b[0].tMin) {
                return -1;
            }
            if (b[0].tMin > a[0].tMin) {
                return 1;
            }
            return 0;
        }
        var visualsCopy = visuals.slice();
        var segments = [];
        var segment = [];
        var endpoints; //just pointers
        while(visualsCopy.length>0) {
            endpoints = [visualsCopy[0]];
            while(endpoints.length>0) {
                var visual = endpoints.shift();
                segment.push(visual);
                visualsCopy.splice(visualsCopy.indexOf(visual), 1);
                var prevVis = prevNeighbor(visual);
                var nextVis = nextNeighbor(visual);
                if(visualsCopy.indexOf(prevVis) > -1) {
                    endpoints.push(prevVis);
                }
                if(visualsCopy.indexOf(nextVis) > -1) {
                    endpoints.push(nextVis);
                }
            }
            segment.sort(cmpVisuals);
            segments.push(segment);
            segment = [];
        }
        segments.sort(cmpSegments);
        return segments;
    }

    var getSegmentsShifts = function(segments) {
        var shifts = [];
        for(seg in segments) {
            var duration = 0;
            var segment = segments[seg];
            var first = segment[0];
            var last = segment[segment.length-1];
            var next = nextNeighbor(last);
            if (next != undefined) {
                duration += next.tMin-first.tMin;
            } else {
                duration += last.vertices[last.vertices.length-1]['t'] - first.tMin;
            }
            shifts.push({'tMin':first.tMin, 'duration':duration});
        }
        return shifts;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////

    // Setup model and other controllers
    visualsModel = visuals_model;
    toolsController = new ToolsController(self);
    renderer = new Renderer(self);

    // Register callbacks for the time controller
    pentimento.timeController.addUpdateTimeCallback(renderer.drawCanvas);
    pentimento.timeController.addBeginRecordingCallback(beginRecording);
    pentimento.timeController.addEndRecordingCallback(stopRecording);

    // Set the starting state of the controller
    self.currentSlide = visualsModel.getSlides()[0];

    // Setup the canvas and context
    self.canvas = $('#'+canvasID);
    self.context = self.canvas[0].getContext('2d');
    var iw = $(window).width();
    var ih = $(window).height();
    $('#'+canvasID)[0].width = 0.8 * iw;
    $('#'+canvasID)[0].height = 0.8 * ih;

};
