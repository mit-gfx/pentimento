"use strict";
var Renderer = function(lecture) {
    var self = {};

    var SELECTED_COLOR = "#88BBFF";
    
    // t_min_color is a way of differentiating visuals that were already
    //   visible on t_min, versus those that were drawn between t_min and t_max
    self.render = function(context, min_t_aud, max_t_aud, t_min_color) {
	var canvas = context.canvas;
	var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	context.clearRect(0, 0, width, height);
	var x_scale = width/VisualsView.WIDTH;
	var y_scale = height/VisualsView.HEIGHT;
        if (x_scale !== 1 || y_scale !== 1) {
            context.scale(x_scale, y_scale);
        };
	var min_t_vis = lecture.retimer.getVisualTime(min_t_aud);
	var max_t_vis = lecture.retimer.getVisualTime(max_t_aud);
	var slide = lecture.visuals.getSlideAtVisT(max_t_vis);
	renderSlide(slide, context, min_t_vis, max_t_vis, t_min_color);
	
	if (x_scale !== 1 || y_scale !== 1) {
	    context.scale(1/x_scale, 1/y_scale);
	}
    
    };

    // t_min, t_max in visual time
    var renderSlide = function(slide, context, t_min, t_max, t_min_color) {
	var transformed = slide.applyTransformToContext(context, t_max);
	var iter = slide.visuals.iterator();
	while (iter.hasNext()) {
	    var visual = iter.next();
	    if (visual.isVisible(t_max)) {
		if (visual.isVisible(t_min)) {
		    renderVisual(visual, context, t_min, t_min_color);
		} else {
		    renderVisual(visual, context, t_max);
		}
	    }
	}
	if (transformed) {
	    context.restore();
	}
    };

    //TODO: this currently assumes all visuals are strokes. Fix to handle other
    // types
    var renderVisual = function(visual, context, t_vis, color) {
	var props = visual.getPropertiesAtTime(t_vis);	
	if (color == null) {
	    if (visual.selected.get()) {
		color = SELECTED_COLOR;
	    } else {
		color = props.color.get();
	    }
	}
	var transformed = visual.applyTransformToContext(context, t_vis);
        context.globalAlpha = 1.0;
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = 1;
        context.lineCap = 'round';
	renderStroke(visual, context, t_vis, color, props.width.get(), props.type.get());
	if (transformed) {
	    context.restore();
	}
    };

    var renderStroke = function(stroke, context, t_vis, color, width, type) {
        var path = [];
        var verts_iter = stroke.vertices.iterator();
        var prev, curr;
        var old_direction;

        if (verts_iter.hasNext()) {
            prev = verts_iter.next();
        }
        while (verts_iter.hasNext()) {
            curr = verts_iter.next();
	    // fill path array with only the visible vertices
            if (t_vis >= curr.t.get()) { 
                var new_direction = getDirection(prev, curr);
                var breaking = false;
                if (new_direction !== old_direction) {
                        breaking = true;
		}
                old_direction = new_direction;
                path.push([prev.x.get(), prev.y.get(), width,
					breaking]);
            }
            prev = curr;
        }

	// Add the last point
        if (curr && t_vis >= curr.t.get()) {
            path.push([curr.x.get(), curr.y.get(), width, false]);
	}

        if (path.length > 0) {
            context.globalAlpha = 1.0;
            context.strokeStyle = color;
            context.fillStyle = color;
            context.lineWidth = 1;
            context.lineCap = 'round';
            if (type === 'calligraphic') {
                drawCalligraphicPath(0, path, false, context);
            } else {
                drawNonCalligraphicPath(0, path, context);
            }
            
        }
    };

    var getDirection = function(v1, v2) {
	var diff_x = v2.x.get() - v1.x.get();
	var diff_y = v2.y.get() - v1.y.get();
	var offset_x = 1;
	var offset_y = -1;
	var angle = Math.atan2(diff_y, diff_x) - Math.atan2(offset_y, offset_x);
	return angle >= 0 ? 1 : -1;
    };

    var drawCalligraphicPath = function(start_index, path, reversed, context) {
        if (start_index === 0) {
            context.beginPath();
	}
        var point = path[start_index];
        var end_index = path.length - 1;
        context.moveTo(point[0] + point[2], point[1] - point[2]);
        for (var i = start_index + 1; i < path.length - 1; i++) {
            point = path[i];
            if (point[3]) { 
                end_index = i + 1;
                i = path.length - 2;
            }
            if (reversed) {
                context.lineTo(point[0] - point[2], point[1] + point[2]);
            } else {
                context.lineTo(point[0] + point[2], point[1] - point[2]);
            }
        }
        for (var i = end_index; i >= start_index; i--) {
            point = path[i];
            if (reversed) {
                context.lineTo(point[0] + point[2], point[1] - point[2]);
            } else {
                context.lineTo(point[0] - point[2], point[1] + point[2]);
            }
        }
        point = path[start_index];
        context.lineTo(point[0] + point[2], point[1] - point[2]);
        if (end_index !== path.length - 1) {
            drawCalligraphicPath(end_index - 1, path, !reversed, context);
	} else {
            context.stroke();
            context.fill();
        }
    };

    //Draw noncalligraphic strokes
    var drawNonCalligraphicPath = function(startIndex, path, context) {
 
        var point = path[startIndex];

        context.beginPath();
        context.arc(point[0], point[1], point[2]/2, 0, Math.PI*2, false); 
        context.fill();

        context.beginPath();

        //get the normal between point and next point
        var nextPoint = path[startIndex+1];
        var dx = point[0]-nextPoint[0];
        var dy = point[1]-nextPoint[1];
        var normal_x = -dy/Math.sqrt(dy*dy+dx*dx);
        var normal_y = dx/Math.sqrt(dy*dy+dx*dx);
        var endIndex = path.length-1;
       
        //start at point+normal*width/2
        context.moveTo(point[0]+(normal_x*point[2]/2),point[1]+(normal_y*point[2]/2));

        //draw lines to the left of all points
        for(var i=startIndex+1; i<endIndex; i++) {
            point = path[i];
            nextPoint = path[i+1];
            dx = point[0]-nextPoint[0];
            dy = point[1]-nextPoint[1];
            normal_x = -dy/Math.sqrt(dy*dy+dx*dx);
            normal_y = dx/Math.sqrt(dy*dy+dx*dx);
           
            context.lineTo(point[0]+(normal_x*point[2]/2),point[1]+(normal_y*point[2]/2));
        }

        //draw lines to the right of all points
        for(var i=endIndex; i>startIndex; i--) {
            point = path[i];
            nextPoint = path[i-1];
            dx = point[0]-nextPoint[0];
            dy = point[1]-nextPoint[1];
            normal_x = dy/Math.sqrt(dy*dy+dx*dx);
            normal_y = -dx/Math.sqrt(dy*dy+dx*dx);
           
            context.lineTo(point[0]-(normal_x*point[2]/2),point[1]-(normal_y*point[2]/2));
        }

        //find the normal for the start point
        point = path[startIndex];
        nextPoint = path[startIndex+1];
        dx = point[0]-nextPoint[0];
        dy = point[1]-nextPoint[1];
        normal_x = -dy/Math.sqrt(dy*dy+dx*dx);
        normal_y = dx/Math.sqrt(dy*dy+dx*dx);

        //connect the polygone to the start point
        context.moveTo(point[0]+(normal_x*point[2]/2),point[1]+(normal_y*point[2]/2));
        //fill the polygone
        context.stroke();
        context.fill();

        context.beginPath();
        point = path[endIndex];
        context.arc(point[0], point[1], point[2]/2, 0, Math.PI*2, true); 
        context.fill();
    };

    return self;
};
