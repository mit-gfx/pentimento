"use strict";
var FileController = function(lecture) {


    // Takes in blobs to create and save a zip to disk
    // Helper method for save()
    var downloadZip = function(json_blob, audio_blobs, image_blobs) {
        // Initialize the zip with a folder
        var zip = new JSZip();
        var audio_folder = zip.folder("audio");
        var image_folder = zip.folder("img");

        // After the total number of blobs have been added, 
        // then the zip will be downloaded
        var zip_blob_count = 0;
        var zip_blob_total = 1+ audio_blobs.length + image_blobs.length;

        // Function for adding a blob to the zip.
        // The zip folder can be the zip itself or just one of the folders.
        var addBlobToZip = function(zip_folder, file_name, blob) {

            // Read the blob data as base64 binary.
            // The onload() function is called after the data is loaded.
            var reader = new FileReader();
            reader.onload = function() {
                var base64_data =  reader.result.split(',')[1];
                
                // Add the data to the zip
                zip_folder.file(file_name, base64_data, {base64: true});

                // Increment the count
                zip_blob_count++;

                // If all files are done, then save the zip to disk
                if (zip_blob_count === zip_blob_total) {
		    var content = zip.generate({type:"blob"}); // Create the zip
		    
		    // use FileSaver.js to save
		    saveAs(content, "pentimento.zip"); //TODO: allow users to title lectures
                };
            };
            reader.readAsDataURL(blob);
        };

        // Add the model JSON blob
        addBlobToZip(zip, "model.json", json_blob);

        // Iterate over the audio blobs and add them to the zip.
        for (var i = 0; i < audio_blobs.length; i++) {
            addBlobToZip(audio_folder, i+".wav", audio_blobs[i]);
        };

        // Iterate over the image blobs and add them to the zip.
        for (var i = 0; i < image_blobs.length; i++) {
            // TODO: find some way to get the type of the image for the file extension
            addBlobToZip(image_folder, i+".png", image_blobs[i]);
        };
    };

    // Helper method for loading a blob from a URL
    // This method takes a callback that will be called when it is finished downloading.
    // This callback should take the loaded blob as an argument: function(blob)
    var loadBlob = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = "blob";

        xhr.onload = function () {
            callback(xhr.response);
        };
        xhr.send();
    };

    
    // Saves the lecture to a zip file
    var save = function() {

        // Convert the JSON form of the model into a blob
        var save_string = JSON.stringify(lecture.saveToJSON());
        var json_blob = new Blob([save_string], {type: "application/json"});
        var json_url = URL.createObjectURL(json_blob);

        // Get all of the blobs from the audio model (iterate over segments)
        // Start with the loading the first blob and use a callback that will load the next blob.
        // When all blobs are loaded, the zip should be downloaded.
        var audio_urls = lecture.audio.getBlobURLs();
	
	if (audio_urls.length == 0) {
	    downloadZip(json_blob, [], []);
	}
	
        var audio_blobs = [];
        var audio_download_callback = function(blob) {
            // Add the blob to the list of blobs
            audio_blobs.push(blob);

            // If there are more blobs to download, then call the loadBlob function with the next URL.
            // Else all the blobs are done loading, and the zip should be downloaded.
            if (audio_blobs.length < audio_urls.length) {
                var index = audio_blobs.length;
                loadBlob(audio_urls[index], audio_download_callback);
            } else {
                downloadZip(json_blob, audio_blobs, []);
            };
        };
        
        // load the first blob to start the chain of downloading.
        loadBlob(audio_urls[0], audio_download_callback);

        // TODO: this needs to be modified to do this after downloading image blobs.
        //          This can be done by creating an image download callback function and replacing the
        //          downloadZip function in the audio_download_callback function with the image download callback.
        //          The image download callback will then be responsible for calling download zip in the same manner as before.
    };


    // Loads the lecture from a JSZip object
    var openFile = function(jszip) {

        // Parse the model.json text file into a JSON object
        var json_model_object = JSON.parse(jszip.file('model.json').asText());

        // Convert the audio files into audio blobs, and then get the URLs for the blobs.
        // The order of the URLs must be the same as the order indicated in the file names.
        // Start with filenames starting at 0.wav and count up until no file is found.
        var audio_folder = jszip.folder('audio');
        var audio_blob_urls = [];
        var i = 0;
        while (true) {
            // NOTE: the type of this is not the standard 'File'
            var audio_file = audio_folder.file(i+'.wav');

            // If the audio file is null, that means there are no more files to process
            if (!audio_file) {
                break;
            };

            // Turn the audio file into a blob
            var audio_blob = new Blob([audio_file.asArrayBuffer()], {type: 'audio/wav'});

            // Get the URL for the audio blob and add it to the array
            audio_blob_urls.push(URL.createObjectURL(audio_blob));

            // Increment the index for the next audio clip filename
            ++i;
        };

        // For all the segments, replace the index in the segment's audio clip with the URL for the loaded audio blob
        var tracks = json_model_object.audio.tracks;
        for (var i = 0; i < tracks.length; i++) {	    
            for (var j = 0; j < tracks[i].timeline.length; j++) {
                var segment = tracks[i].timeline[j].segment;
                segment.audio_url = audio_blob_urls[segment.audio_url];
            };
        };

        // Load the models
        lecture.loadFromJSON(json_model_object);

	//TODO
        // Initialize the controller with the new model
        self.init();
    };


    // Callback for lecture loading button
    var load = function() {
        var files = this.files;

        // Only one file should be selected
        if (files.length !== 1) {
            console.error('Only one file can be opened at a time');
        };

        var file = files[0];

        // Use a file reader to read the zip file as a binary string,
        // and load the information into a JSZip object so that it can be loaded into the lecture.
        var reader = new FileReader();
        reader.onload = function(){
            var data = reader.result;
            var new_zip = new JSZip();
            new_zip.load(data);
            openFile(new_zip);
        }
        reader.readAsBinaryString(file);
    };


    // Save button handler
    $('#save').click(save);

    // Open button handler
    $('#file-opener').change(load);

};
