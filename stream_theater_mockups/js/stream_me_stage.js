'use strict'

var QUEUE_TYPE = { VERT: 0, HORZ: 1, FULLSCREEN: 2 };
var TRANSITION = { QUEUE_HIDE: 0, QUEUE_SHOW: 1 };

function StreamMeStage(panel, streamSource, draggingContext)
{
    this.panel_ = (typeof panel === 'string') ? $(panel) : panel;
    this.streamSource_ = streamSource;
    this.draggingContext_ = draggingContext;

    this.streamMePanel_ = this.panel_.find('#stream-me-stage');
    this.layoutControl_ = this.panel_.find('#layout-control');
    this.layoutStage_ = this.panel_.find('#layout-stage'); 
    this.queueControl_ = this.panel_.find('#layout-queue'); 
    this.layoutLayout_ = this.panel_.find('#layout-layout'); 

    this.streamLayout_ = new StreamLayout(this.layoutLayout_, this.streamSource_, this.draggingContext_);
    this.bodyStyles_ = window.getComputedStyle(document.body);

    this.transitionActive_ = false;
    this.transition_ = null;
    this.uiCalls_ = [];

    this.nextStreamId_ = 0;
    this.streams_ = {};

    this.queues_ = null;
    this.currentLayout_ = 2;
    this.currentQueueLayout_ = 1;

    this.queueWidth_ = this.bodyStyles_.getPropertyValue('--queue-width');
    this.queueHeight_ = this.bodyStyles_.getPropertyValue('--queue-height');

    this.GenerateLayoutControls();
    this.AddControlsDelimiter();
    this.AddQueueControls();

    this.queueControl_.on('transitionend', this.OnQueueTransitionEnd.bind(this) )
    this.queueControl_.on('mousewheel', this.OnQueueMouseWheel.bind(this) )
}

StreamMeStage.prototype.AddControlsDelimiter = function()
{
    var controlString = "<div class='delimiter'></div>";
    this.layoutControl_.append(controlString);
}

StreamMeStage.prototype.PushUICall = function(func)
{
    //console.log("PUSH UI CALL");
    if (this.transitionActive_)
    {
        this.uiCalls_.push(func);
        //console.log("PUSH CALL " + this.uiCalls_.length);
    }
    else
    {
        func();        
        //console.log("IMMEDIATE CALL");
    }
}

StreamMeStage.prototype.TransitionFinshed = function()
{
    this.transitionActive_ = false;

    while (!this.transitionActive_ && this.uiCalls_.length > 0)
    {
        var func = this.uiCalls_.pop();
        //console.log("POP CALL " + this.uiCalls_.length);
        if (func)
            func();
    }
}

StreamMeStage.prototype.OnQueueMouseWheel = function(evt)
{
    var delta = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));
    var queue = this.queues_[this.currentQueueLayout_];

    if (queue.type_ === QUEUE_TYPE.VERT)
        this.queueControl_.get(0).scrollTop -= (delta*50);
    else
        this.queueControl_.get(0).scrollLeft -= (delta*50);
        
    evt.preventDefault();
}

StreamMeStage.prototype.OnLayoutControl = function(id)
{
    if (this.currentLayout_ !== id)
    {
        var controlOld = this.layoutControl_.children().eq(this.currentLayout_);
        var controlNew = this.layoutControl_.children().eq(id);

        //console.log("LC " + this.currentLayout_ + " " + id, controlOld, controlNew);

        controlOld.removeClass("selected");
        controlNew.addClass("selected");

        this.currentLayout_ = id;

        this.streamLayout_.SetLayout(id);
    }
}

StreamMeStage.prototype.OnQueueTransitionEnd = function()
{
    if (!this.transitionActive_)
        return;

    console.log('TRANSITION END');
    if (this.transition_ === TRANSITION.QUEUE_HIDE)
    {
        var queue = this.queues_[this.currentQueueLayout_];

        this.layoutStage_.css("flex-direction", queue.fdir_);

        if (queue.type_ === QUEUE_TYPE.VERT)
        {
            console.log("NOW VERT");
            this.queueControl_.css("flex-direction", "column");
            this.queueControl_.css("width", "0px");
            this.queueControl_.get(0).offsetHeight; // reflow
            this.queueControl_.css("transition-property", "width");
            this.queueControl_.css("width", this.queueWidth_);
            this.queueControl_.css("height", "100%");
        }

        if (queue.type_ === QUEUE_TYPE.HORZ)
        {
            console.log("NOW HORZ");
            this.queueControl_.css("flex-direction", "row");
            this.queueControl_.css("height", "0px");
            this.queueControl_.get(0).offsetHeight; // reflow
            this.queueControl_.css("transition-property", "height");
            this.queueControl_.css("height", this.queueHeight_);
            this.queueControl_.css("width", "100%");
        }

        this.transition_ = TRANSITION.QUEUE_SHOW;
    }
    else if (this.transition_ === TRANSITION.QUEUE_SHOW)
    {
        this.streamLayout_.OnResize();
        this.TransitionFinshed();
    }
}

StreamMeStage.prototype.OnQueueControl = function(id)
{
    console.log("OnQueueControl", id);

    if (this.currentQueueLayout_ !== id)
    {
        var queue = this.queues_[this.currentQueueLayout_];

        this.transition_ = TRANSITION.QUEUE_HIDE;
        this.transitionActive_ = true;
        this.currentQueueLayout_ = id;

        queue.control_.removeClass("selected");
        this.queues_[id].control_.addClass("selected");

        if (queue.type_ === QUEUE_TYPE.VERT)
        {
            this.queueControl_.css("transition-property", "width");
            this.queueControl_.css("width", "0px");
        }

        if (queue.type_ === QUEUE_TYPE.HORZ)
        {
            this.queueControl_.css("transition-property", "height");
            this.queueControl_.css("height", "0px");
        }
    }
}

StreamMeStage.prototype.AddQueueControls = function()
{
    this.queues_ = 
    [
        {class_:'queue-left', type_:QUEUE_TYPE.VERT, fdir_: "row-reverse"},
        {class_:'queue-right', type_:QUEUE_TYPE.VERT, fdir_: "row"},
        {class_:'queue-top', type_:QUEUE_TYPE.HORZ, fdir_: "column-reverse"},
        {class_:'queue-bottom', type_:QUEUE_TYPE.HORZ, fdir_: "column"},
        {class_:'queue-full', type_:QUEUE_TYPE.FULLSCREEN}
    ];

    for (var i = 0; i < 4; ++i)
    {
        var controlString = "<div class='control'>";
        controlString += "<div class='" + this.queues_[i].class_ + " animable'>";
        controlString += "</div></div>";       

        var control = this.layoutControl_.append(controlString).children().last();

        var callback = function(i) { this.OnQueueControl(i); }.bind(this, i);
        control.on('click', function(callback) { this.PushUICall(callback); return true; }.bind(this, callback) );

        this.queues_[i].control_ = control; 

        if (this.currentQueueLayout_ === i)
            control.addClass("selected");
    }
}

StreamMeStage.prototype.GenerateLayoutControl = function(className, scheme)
{
    var controlString = "<div class='control'>";

    if (scheme[0] === 0)
    {
        for (var j = 1; j < scheme.length; ++j)
        {
            if (scheme[j] > 1)
            {
                controlString += "<div class='black'>";
                for (var k = 0; k < scheme[j]; ++k)
                {
                    controlString += "<div class='" + className + " animable'></div>";
                }

                controlString += "</div>";
            }   
            else
            {
                controlString += "<div class='" + className + " animable'>";
                controlString += "</div>";
            }             
        }
    }

    controlString += "</div>";

    return controlString;
}

StreamMeStage.prototype.GenerateLayoutControls = function()
{
    for (var i = 0; i < this.streamLayout_.Layouts.length; ++i)
    {
        var scheme = this.streamLayout_.Layouts[i].scheme_;
        if (scheme.length < 2)
            continue;

        var controlString = StreamMeStage.prototype.GenerateLayoutControl("white", scheme);

        var control = this.layoutControl_.append(controlString).children().last();

        var callback = function(i) { this.OnLayoutControl(i); }.bind(this, i);
        control.on('click', function(callback) { this.PushUICall(callback); return true; }.bind(this, callback) );

        if (this.currentLayout_ === i)
        {
            control.addClass("selected");
            this.streamLayout_.SetLayout(this.currentLayout_);
        }
    }
}

StreamMeStage.prototype.StartStage = function(numStreams) 
{
    for (var i = 0; i < numStreams; ++i)
    {
        var streamDesc = {}
        
        streamDesc.streamUrl_ = this.streamSource_.NextStreamUrl();
        streamDesc.selected_ = false;
        streamDesc.shown_ = false;

        this.streams_[this.nextStreamId_] = streamDesc;
        this.nextStreamId_++;

        var htmlString = this.streamSource_.BuildVideoContainer(streamDesc.streamUrl_, true, true);

        this.queueControl_.append(htmlString);
    }

    console.log(this.streams_);
}