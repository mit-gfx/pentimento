"use strict";
var AudioTrack = function(parent_id, lecture) {
    
    var self = {};
    self.timeline = Accessor([]); // see createEntry for item format
    self.segment_selection = SegmentSelection();

    self.getID = StaticGetter("track" + AudioTrack.counter.get());
    AudioTrack.counter.increment(1);

    var createEntry = function(segment, track_time) {
	return {segment: segment, track_time: Accessor(track_time)};
    }	

    self.getTimelinePosition = function(track_time) {
	if (track_time < 0) {
	    return {index: -1, before_current_entry: false};
	}
	
	var iter = self.timeline.iterator();
	var index = 0;
	while (iter.hasNext()) {
	    var timeline_entry = iter.next();
	    var start = timeline_entry.track_time.get();

	    if (track_time <= start) {
		return {index: index, before_current_entry: true};
	    }

	    var end = start + timeline_entry.segment.getDuration();
	    
	    if (track_time < end) {
		return {index: index, before_current_entry: false};
	    }

	    index++;
	}
	
	return {index: index, before_current_entry: true};
    };

    self.indexBySegment = function(segment) {
	var iter = self.timeline.iterator();
	var index = 0;
	while (iter.hasNext()) {
	    if (iter.next().segment == segment) {
		return index;
	    }
	    index++;
	}
	return -1;
    };

    self.indexBySegmentID = function(id) {
	var iter = self.timeline.iterator();
	var index = 0;
	while (iter.hasNext()) {
	    if (iter.next().segment.getID() == id) {
		return index;
	    }
	    index++;
	}
	return -1;
    };

    self.canChangeSegmentTimes = function(index, delta_start, delta_end) {
	var current_entry = self.timeline.valueAt(index);
	var segment = current_entry.segment;
	// If not simply shifting in the track, make sure the audio clip can
	// handle the time changes
	if (delta_start != delta_end &&
	    !segment.canChangeClipTimes(delta_start, delta_end)) {
	    return false;
	}
	
	var new_start = current_entry.track_time.get() + delta_start;
	var new_end = current_entry.track_time.get() + segment.getDuration()
	    + delta_end;
	
	// Can't have a negative start time, or an end time that is before the
	// start time.
	if (new_start < 0 || new_end < new_start) {
	    return false;
	}

	// Check that the change won't result in overlapping segments
	
	var start_position = self.getTimelinePosition(new_start);
	var end_position = self.getTimelinePosition(new_end);
	
	// The non-changed segment is still in the timeline, so change positions
	// that are within the current segment's entry to be before the next
	// entry.
	if (start_position.index == index) {
	    start_position = {index: index + 1, before_current_entry: true};
	}
	if (end_position.index == index) {
	    end_position = {index: index + 1, before_current_entry: true};
	}
	
	// If the position indices aren't the same, or if a position is
	// within an entry instead of before an entry, then the changed segment
	// would end up overlapping other segments. 
	if (start_position.index != end_position.index ||
	    !start_position.before_current_entry ||
	    !end_position.before_current_entry) {
	    return false;
	}

	return true;
    };

    self.changeSegmentTimes = function(index, delta_start, delta_end) {
	if (!self.canChangeSegmentTimes(index, delta_start, delta_end)) {
	    return false;
	}
	var entry = self.timeline.valueAt(index);
	var track_time = entry.track_time;
	track_time.increment(delta_start);
	var segment = entry.segment;
	if (delta_start != delta_end) {
	    segment.changeClipTimes(delta_start, delta_end);
	}

	// update the entry's position within the timeline
	var position = self.getTimelinePosition(track_time);
	if (position.index !== index) {
	    var entry = self.timeline.removeIndex(index);
	    self.timeline.insert(entry, position.index - 1);
	}
	
	return true;
    };

    self.canShiftSegment = function(index, shift_amount) {
	return self.canChangeSegmentTimes(index, shift_amount, shift_amount);
    };

    self.shiftSegment = function(index, shift_amount) {
	return self.changeSegmentTimes(index, shift_amount, shift_amount);
    };

    // Shift all segments after start_time by shift_amount.
    var shiftSegments = function(start_time, shift_amount) {
	var iter = self.timeline.iterator();
	while (iter.hasNext()) {
	    var entry = iter.next();
	    if (entry.track_time.get() >= start_time) {
		entry.track_time.increment(shift_amount);
	    }
	}
    };

    self.insertSegment = function(new_segment, track_time) {
	var position = self.getTimelinePosition(track_time);	
	if (position.before_current_entry) {
	    var new_entry = createEntry(new_segment, track_time);
	    self.timeline.insert(new_entry, position.index);
	    return true;
	}

	// track_time is within the current entry at position.index, so we have
	// to split that entry's segment before we can insert the new_segment
	var entry = self.timeline.valueAt(position.index);
	var t = track_time - entry.track_time.get();
	var remainder_seg = entry.segment.split(t);
	var remainder_entry = createEntry(remainder_seg, track_time)
	self.timeline.insert(remainder_entry, position.index + 1);

	// shift all the segments after the insert time and insert the
	// new_segment after the left_entry (e.g. at position.index + 1)
	shiftSegments(track_time, new_segment.getDuration());
	var new_entry = createEntry(new_segment, track_time);
	self.timeline.insert(new_entry, position.index + 1);

	return true;
    };

    // if segment_id is not provided, removes all selected segments
    self.removeSegment = function(segment_id) {
	if (segment_id != null) {
	    var index = self.indexBySegmentID(segment_id);
	    self.timeline.removeIndex(index);
	    if (self.segment_selection.has(segment_id)) {
		self.segment_selection.remove(segment_id);
	    }
	} else {
	    // Can't use the iterator because we remove segments from the
	    // offical selection as we go through the ids.
	    var selection = self.segment_selection.get();
	    for (var i = 0; i < selection.length; i++) {
		self.removeSegment(selection[i]);
	    }
	}
    };

    // Scales the audio segment by the specified factor.
    // A factor from 0 to 1 shrinks, and a factor above 1 expands.
    // The anchor point is the left hand side.
    // Other segments to the right will be shifted as a result.
    self.scaleSegment = function(segment, scale_factor) {
        // TODO
    };

    // Get the end time of the track in milliseconds
    // Returns 0 if the track is empty
    self.getDuration = function() {
	var last_index = self.timeline.getLength() - 1;

	if (last_index < 0) {
	    return 0;
	}
	var last_entry = self.timeline.valueAt(last_index);
	return last_entry.track_time.get() + last_entry.segment.getDuration();
    };
    
    var playing_segment, play_timeout;
    self.startPlayback = function(t_audio) {
	var index = self.getTimelinePosition(t_audio).index;
	var length = self.timeline.getLength();	
	var playNextSegment = function() {
	    playing_segment = null;
	    if (index >= length) {
		return;
	    }
	    var entry = self.timeline.valueAt(index);
	    var track_time = entry.track_time.get();
	    var segment = entry.segment;
	    if (t_audio > track_time) {
		segment.startPlayback(playNextSegment, t_audio - track_time);
		playing_segment = segment;
	    } else {
		play_timeout = setTimeout(function() {
		    segment.startPlayback(playNextSegment);
		    playing_segment = segment;
		}, track_time - t_audio);
	    }
	    // Update variables for next time playNextSegment is called
	    t_audio = track_time + segment.getDuration();
	    index++;
	};

	playNextSegment();
    };

    self.stopPlayback = function() {
	clearTimeout(play_timeout);
	if (playing_segment) {
	    playing_segment.stopPlayback();
	}
    };
	

    // Saving the model to JSON.
    // Returns a JSON string
    self.saveToJSON = function() {
        var json_object = {
            timeline: []
        };

	var iter = self.timeline.iterator();
	while (iter.hasNext()) {
	    var entry = iter.next();
	    timeline.push({track_time: entry.track_time.get(),
			   segment: entry.track_time.saveToJSON()});
	}
	
        return json_object;
    };

    AudioTrackController(self, parent_id, lecture);
    return self;
};
// Loading the model from JSON
AudioTrack.loadFromJSON = function(json_object) {

    var json_timeline = json_object.timeline;
    var timeline = [];
    for (var i = 0; i < json_timeline.length; i++) {
	var json_entry = json_timeline[i];
	timeline.push({track_time: Accessor(json_entry.track_time),
		       segment: AudioSegment.loadFromJSON(json_entry.segment)});
    
    }
    
    // Create a new track and set the segments to the array created above.
    var track = AudioTrack();
    track.setAudioSegments(audio_segments);

    return track;
};

AudioTrack.counter = Accessor(0);
