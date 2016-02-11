"use strict";

//TODO: rename this to Getter
var StaticGetter = function(value) {
    return function() { return value; };
};
