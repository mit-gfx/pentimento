//Because of integration with the undo manager, the undo actions should call updateVisuals()
//appropriately. Only the undo actions, though, not the forward actions! Therefore, any time
//um.add is called, it should have an updateVisuals inside of the function if necessary
"use strict";

var VisualsController = function(visuals_model, retimer_model) {
    var self = this;
    var visualsModel = null;
    var retimerModel = null;
    var toolsController = null;
    var renderer = null;

    // Variables used for recording
    var originSlide = null;
    var originSlideDuration = null;
    var shiftInterval = null;
    var dirtyVisuals = [];
    var slideBeginTime = NaN;

    // DOM elements
    var canvasID = "sketchpad";

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

    this.getRetimerModel = function() {
        return retimerModel;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Drawing of Visuals
    ///////////////////////////////////////////////////////////////////////////////

    // Callback function of updateTime.
    // Draws to the canvas through the renderer
    var drawVisuals = function(time) {
        // Convert the audio time to visuals time
        var visualsTime = retimerModel.getVisualTime(time);

        // Render the canvas
        var canvas = $('#' + canvasID);
        var context = canvas[0].getContext('2d')
        renderer.drawCanvas(canvas, context, 0, visualsTime);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Recording of Visuals
    //
    // Handlers for when recording begins and ends.
    // Includes helper functions for recording logic.
    ///////////////////////////////////////////////////////////////////////////////

    var beginRecording = function(currentTime) {
        $('.recording-tool').toggleClass('hidden');
        if($('#visuals_checkbox').prop('checked')){
            console.log("VISUALS CHECKED");
            if (!self.currentSlide) {
                console.error("there is no current slide");
                return;
            }

            self.selection  = [];
            $('input[data-toolname="pen"]').click();

            // slideBeginTime starts as the visuals time that recording began
            slideBeginTime = retimerModel.getVisualTime(currentTime);

            // Keep the origin slides and set visuals dirty so we can shift the visuals in these slides when recording ends
            originSlide = self.currentSlide;
            originSlideDuration = originSlide.getDuration();
            visualsModel.setDirtyVisuals(slideBeginTime);
        }
    };

    var stopRecording = function(currentTime) {
        $('.recording-tool').toggleClass('hidden');
        if($('#visuals_checkbox').prop('checked')){
            console.log("VISUALS CHECKED");
            self.selection  = [];
            self.tool = null;

            var slideRecordDuration = retimerModel.getVisualTime(currentTime) - slideBeginTime;
            self.currentSlide.setDuration(self.currentSlide.getDuration() + slideRecordDuration);

            // Restores the dirty visuals to their former places and adds a shift.
            visualsModel.cleanVisuals(dirtyVisuals, originSlide.getDuration() - originSlideDuration);
            
            // Reset recording variables
            slideBeginTime = NaN;
            originSlide = null;
            originSlideDuration = null;
            dirtyVisuals = [];
        }
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

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////

    // Setup model and other controllers
    visualsModel = visuals_model;
    retimerModel = retimer_model;
    toolsController = new ToolsController(self, visualsModel);
    renderer = new Renderer(self);

    // Register callbacks for the time controller
    pentimento.timeController.addUpdateTimeCallback(drawVisuals);
    pentimento.timeController.addBeginRecordingCallback(beginRecording);
    pentimento.timeController.addEndRecordingCallback(stopRecording);

    // Set the starting state of the controller
    self.currentSlide = visualsModel.getSlides()[0];

    // Setup the canvas and context
    // Canvas size must be set using attributes, not CSS
    self.canvas = $('#'+canvasID);
    self.canvas.attr('width', visualsModel.getCanvasSize().width)
                .attr('height', visualsModel.getCanvasSize().height);
    self.context = self.canvas[0].getContext('2d');


};

