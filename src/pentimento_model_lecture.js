/*************************************************
					MODEL
*************************************************/

function SlideTransform(type, tmin, durate, mat) {
    var self = this;
    self.tMin = tmin;
    self.duration = durate;
    self.matrix = mat;

    this.getTMin = function() { return self.tMin; }
    this.getDuration = function() { return self.duration; }
    this.getMatrix = function() { return self.matrix; }
    this.setTMin = function(newTMin) { self.tMin = newTMin; }
    this.setDuration = function(newDuration) { self.duration = newDuration; }
    this.setMatrix = function(newMatrix) { self.matrix = newMatrix; }
}

SlideTransform.prototype.getClone = function() {
    
}

function Slide() {
    var visuals = [];
    var transforms = [];
    var duration = 0.0;
    
    this.getVisuals = function() { return visuals; }
    this.getDuration = function() { return duration; }
    this.getTransforms = function() { return transforms; }

    this.setVisuals = function(newVisuals) { visuals = newVisuals; }
    this.setDuration = function(newDuration) { duration = newDuration; }
    this.setTransforms = function(newTransforms) { transforms = newTransforms; }

    this.getVisualsIterator = function() { return new Iterator(visuals); }
    this.getTransformsIterator = function() { return new Iterator(transforms); }
};

ConstraintTypes = {
	Manual: "Manual",
	Automatic: "Automatic"
}

function Constraint(tvis, taud, mytype) {
    var tVis = tvis;
    var tAud = taud;
    var type = mytype;

    this.getTVis = function() { return tVis; }
    this.getTAud = function() { return tAud; }
    this.getType = function() { return type; }

    this.setTVis = function(newTVis) { tVis = newTVis; }
    this.setTAud = function(newTAud) { tAud = newTAud; }
    this.setType = function(newType) { type = newType; }
}

function Lecture() {
    var slides = [];
    var audioTracks = [];
    var constraints = [];
    // var transforms = [];
    
    this.getSlides = function() { return slides; }
    this.getAudioTracks = function() { return audioTracks; }
    this.getConstraints = function() { return constraints; }
    // this.getTransforms = function() { return transforms; }

    this.setSlides = function(newSlides) { slides = newSlides; }
    this.setAudioTracks = function(newAudioTracks) { audioTracks = newAudioTracks; }
    this.setConstraints = function(newConstraints) { constraints = newConstraints; }
    // this.setTransforms = function(newTransforms) { transforms = newTransforms; }

    this.getSlidesIterator = function() { return new Iterator(slides); }
};