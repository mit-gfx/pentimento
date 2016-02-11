"use strict";
var AudioController = function(audio, lecture) {

    var evt_mgr = AudioEventManager();
    var EVENTS = evt_mgr.EVENT_TYPES;
    AudioView(audio, TimelineView.IDS.overlay);

    var deleteSegments = function(e) {
	var track_iter = audio.tracks.iterator();
	while(track_iter.hasNext()) {
	    track_iter.next().removeSegment();
        };
    };
    evt_mgr.addEventListener(EVENTS.delete_segments, deleteSegments);
    
    var insertTrack = function(e) {
        audio.addTrack();
    };
    evt_mgr.addEventListener(EVENTS.insert_track, insertTrack);

    var deleteTrack = function(e) {
	audio.removeTrack();
    };
    evt_mgr.addEventListener(EVENTS.delete_track, deleteTrack);
    
    var changeTrack = function(e) {
        audio.active_track_index.set(e.track_num - 1);
    };
    evt_mgr.addEventListener(EVENTS.change_track, changeTrack);
  
};
