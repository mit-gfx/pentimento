"use strict";
var VisualsController = function(lecture, visuals) {

    //// TOOLS ////
    
    var TOOL_CLASS = "visuals-tool";
    var tools = {
	pen: PenTool(visuals),
	select: SelectTool(visuals)
    };
    var active_tool = tools.pen;

    $("." + TOOL_CLASS).click(function(e) {
	active_tool = tools[$(this).attr("id")];
    });
    
    var extendEventArgs = function(args) {
	var aud_t = lecture.timer.current_time.get();
	args.vis_t = lecture.retimer.getVisualTime(aud_t);
	args.recording = lecture.is_recording.get();
	return args;
    };
    
    var canvas_evt_mgr = PointerEventManager(VisualsView.IDS.canvas);
    var CANVAS_EVENTS = canvas_evt_mgr.EVENT_TYPES;
    canvas_evt_mgr.addEventListener(CANVAS_EVENTS.pointer_down, function(e) {
	active_tool.start(extendEventArgs(e));
    });
    canvas_evt_mgr.addEventListener(CANVAS_EVENTS.pointer_drag, function(e) {
	active_tool.update(extendEventArgs(e));
    });
    canvas_evt_mgr.addEventListener(CANVAS_EVENTS.pointer_up, function(e) {
	active_tool.stop(extendEventArgs(e));
    });

    var sel_evt_mgr = PointerEventManager(VisualsView.IDS.selection,
					  VisualsView.IDS.canvas);
    var SEL_EVENTS = sel_evt_mgr.EVENT_TYPES;
    sel_evt_mgr.addEventListener(SEL_EVENTS.pointer_down, function(e) {
	canvas_evt_mgr.disableEvents();
	active_tool.start(extendEventArgs(e));
    });
    sel_evt_mgr.addEventListener(SEL_EVENTS.pointer_drag, function(e) {
	active_tool.update(extendEventArgs(e));
    });
    sel_evt_mgr.addEventListener(SEL_EVENTS.pointer_up, function(e) {
	active_tool.stop(extendEventArgs(e));
	canvas_evt_mgr.enableEvents();
    });

    
    //// ACTIONS ////

    var actions_evt_mgr = ActionsEventManager(lecture);
    var ACTION_EVENTS = actions_evt_mgr.EVENT_TYPES;
        
    var changeProperty = function(e) {
	visuals.current_props[e.name].set(e.value);
    };
    actions_evt_mgr.addEventListener(ACTION_EVENTS.property_change,
				     changeProperty);

    var addSlide = function(e) {
	visuals.addSlide(e.vis_t);
    };
    actions_evt_mgr.addEventListener(ACTION_EVENTS.add_slide, addSlide);

    var deleteSlide = function(e) {
	var slide = visuals.getSlideAtVisT(e.vis_t);
	visuals.slides.removeValue(slide);
	//TODO: redraw main canvas and thumbnails
	//TODO: shift later slides up in time
    };
    actions_evt_mgr.addEventListener(ACTION_EVENTS.delete_slide, deleteSlide);

    var deleteVisuals = function(e) {
	var vis_t;
	if (e.recording) {
	    vis_t = e.vis_t;
	}
	// a null vis_t will delete the visuals from the entire lecture
	visuals.selection.deleteVisuals(vis_t);
    };
    actions_evt_mgr.addEventListener(ACTION_EVENTS.delete_visuals,
				     deleteVisuals);


    //// VIEW ////
    
    var view = VisualsView(visuals, lecture);
    lecture.timer.current_time.addEventListener(view.draw);
    visuals.selection.addEventListener(view.draw);
};

