"use strict";
var Tool = function() {
    var not_implemented = function() {
	throw Error("Needs to be implemened by child class");
    };
    return {
	start: not_implemented,
	update: not_implemented,
	stop: not_implemented
    };
};



