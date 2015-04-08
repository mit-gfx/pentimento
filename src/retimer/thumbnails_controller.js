/* TODO:
    0) Updated rest of code to work again with these functions
    1) redraw all of the thumbnails each time the visuals are redrawn/edited
    2) refactor to take into account audio times/"global times"/retimer times when drawing thumbnails
*/
var ThumbnailsController = function(visuals_controller, audio_controller) {

    var self = this;
    var visualsController = visuals_controller;
    var audioController = audio_controller;
    var renderer = new Renderer(visualsController);
    var pixelSecondRatio = -1;
    // TODO need setter

    // Draw the thumbnails whenever the visuals in the main window are updated or changed
    // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
    // zoomFactor: how much to scale the curret zoom by.

    // calculate number of thumbnails to draw
    // setup all the canvases
    // iterate over and call generate thumbnail
    this.drawThumbnails = function() {

        console.log("THUMBNAILS?!");
        var max_time = pentimento.lectureController.getLectureModel().getLectureDuration();

        // Calculate number of thumbnails to generate.
        var total_width = audioController.millisecondsToPixels(max_time);

        console.log("totalWidth: " + total_width);

        var original_height = visualsController.getVisualsModel().getCanvasSize().height;
        var original_width = visualsController.getVisualsModel().getCanvasSize().width;
        var scale = $('#thumbnails_div').height()/original_height;
        var thumbnail_width = Math.round(scale * original_width);

        console.log("thumbnailWidth: " + thumbnail_width);

        var numThumbs = total_width/thumbnail_width;

        console.log("numThumbs: " + numThumbs);
        // Generate the thumbnail for each thumbnail in the sequence
        for(var i=0; i<numThumbs; i++){

            // Establish which number the thumbnail is
            var thumbOffset = i;

            // Calculate the minimum ad maximum times associated with visuals to display for the thumbnail
            // If it is the last thumbnail then set the maximum time to the duration of the lecture 
            // TODO: convert to audio time?? or from audio time??
            var curr_min = audioController.pixelsToMilliseconds(i*thumbnail_width);
            var curr_max = audioController.pixelsToMilliseconds((i+1)*thumbnail_width);
            if((i+1) == numThumbs){
                curr_max = max_time;
            }

            // Generate the thumbnail drawing
            generateThumbnail(thumbOffset, curr_min, curr_max, thumbnail_width);
        }
    }; 

    // Generate the thumbnails by getting the visuals from the slides.
    // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
    // thumbOffset: the number of the thumbnail in the sequence of all of the thumbnails
    // currMin: the minimum time to be displayed by the current thumbnail
    // currMax: the maximumm time to be displayed by the current thumbnail

    // param: time, duration, thumbnailIndex
    var generateThumbnail = function(thumbOffset, curr_min, curr_max, thumbnail_width){

        // Context
        var canvasHTML = "<canvas id='thumbnail_" + thumbOffset + "' width='" + String(thumbnail_width) + "'> </canvas>";
        $('#thumbnails_div').append(canvasHTML);
        var canvasID = 'thumbnail_' + thumbOffset;

        // Draw the thumbnail image in the middle of the time interval represented by the thumbnail
        var thumbTime = Math.round((curr_min + curr_max)/2);

        // Render the thumbnail on the appropriate canvas
        renderer.drawCanvas(canvasID, thumbTime)
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////

    // Register handlers for playing and pausing the visuals
    pentimento.timeController.addEndRecordingCallback(function(currentTime) {
        self.drawThumbnails();
    });
    pentimento.timeController.addBeginPlaybackCallback(function(currentTime) {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });
    pentimento.timeController.addEndPlaybackCallback(function(currentTime) {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });


};