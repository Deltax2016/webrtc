'use strict'

function StreamLayout(panel, streamSource, draggingContext)
{
    this.panel_ = (typeof panel === 'string') ? $(panel) : panel;
    this.streamSource_ = streamSource;
    this.draggingContext_ = draggingContext;
    this.layout_ = null;

    this.bodyStyles_ = window.getComputedStyle(document.body);
    this.videoMargin_ = parseInt(this.bodyStyles_.getPropertyValue('--queue-video-margin'));
    this.videoAspect_ = 16.0/9.0;

    this.currentDraggedVideo_ = null;
    this.originalDragId_ = null;

    this.Layouts = 
    [
        // 0 at zero index means horizontal layout
        {scheme_: [0, 1]},
        {scheme_: [0, 1, 1]},
        {scheme_: [0, 2, 1]},
        {scheme_: [0, 2, 2]},
        {scheme_: [0, 3, 2]}, 
        {scheme_: [0, 3, 3, 3]} 
    ];

    this.PrepareLayouts();

    window.addEventListener('resize', function(evt) { return this.OnResize(); }.bind(this));
}

StreamLayout.prototype.PrepareLayouts = function()
{
    for (var i = 0; i < this.Layouts.length; ++i)
    {
        var layout = this.Layouts[i];
        
        layout.numVideos_ = 0;
        layout.numVRulers_ = 0;
        layout.numHRulers_ = layout.scheme_.length - 2;        
        
        layout.rulersH_ = {};
        layout.rulersV_ = {};

        var rulerPosH = 0;
        
        for (var r = 0; r < layout.numHRulers_; ++r)
        {
            rulerPosH += 1 / (layout.numHRulers_ + 1);
            layout.rulersH_[r] = rulerPosH;
        }

        var vertRulerId = 0;

        for (var j = 1; j < layout.scheme_.length; ++j)
        {
            layout.numVideos_ += layout.scheme_[j];
            layout.numVRulers_ += layout.scheme_[j] - 1;

            var rulerPosV = 0;
            for (var r = 0; r < layout.scheme_[j] - 1; ++r)
            {
                rulerPosV += 1 / layout.scheme_[j];
                layout.rulersV_[vertRulerId] = rulerPosV;
                vertRulerId++;
            }
        }
    }

    console.log(this.Layouts);
}

StreamLayout.prototype.OnResize = function()
{
    if (this.layout_.scheme_.length < 2)
        return;

    //onsole.log(this.layout_);

    var bounds = this.panel_.get(0).getBoundingClientRect();
    var rows = this.layout_.scheme_.length - 1;

    var id = 0;
    var rulerVId = 0;
    var Y = 0;

    for (var i = 1; i < rows + 1; ++i)
    {
        var rowHeight = i < rows ? bounds.height * this.layout_.rulersH_[i - 1] - Y : bounds.height - Y;
        var columns = this.layout_.scheme_[i];

        //console.log("DRAW: " + Y + " " + rowHeight, this.layout_.rulersH_);

        var rulerH = this.panel_.find(".horz-ruler").eq(i - 1);
        rulerH.css("top", Y + rowHeight + "px");

        var X = 0;

        for (var j = 0; j < columns; ++j)
        {
            var columnWidth = j < columns - 1 ? bounds.width * this.layout_.rulersV_[rulerVId] - X : bounds.width - X;
            var cellSize = Utils.SizeAndPosWithAspect(columnWidth, rowHeight, 1, this.videoAspect_);

            if (j < columns - 1)
            {
                var rulerV = this.panel_.find(".vert-ruler").eq(rulerVId);
                rulerVId++;

                rulerV.css("top", Y + "px");
                rulerV.css("height", rowHeight + "px");
                rulerV.css("left", X + columnWidth + "px");

                rulerV.attr("gridY", i - 1);
                rulerV.attr("gridX", j);
            }
            
            var videoContainer = this.panel_.find("#" + UI.ID_PREFIX_ + id + ".video-container");

            if (this.currentDraggedVideo_ === null || 
                (videoContainer.attr("id") !== this.currentDraggedVideo_.attr("id")))
            {
                var videoPlayer = videoContainer.find(".video-player");

                videoContainer.css('left', X + 'px');
                videoContainer.css('top',  Y + 'px');
                videoContainer.css('width', columnWidth + 'px');
                videoContainer.css('height', rowHeight + 'px');

                videoPlayer.css('left', cellSize.xShift_ + 'px');
                videoPlayer.css('top',  cellSize.yShift_  + 'px');
                videoPlayer.css('width', cellSize.cellWidth_ + 'px');
                videoPlayer.css('height', cellSize.cellHeight_ + 'px');
            }
            
            id++;
            X += columnWidth + this.videoMargin_;
        }

        Y += rowHeight + this.videoMargin_;
    }
}

StreamLayout.prototype.SetLayout = function(id)
{
    var numVideosOld = 0;
    var numRulersHOld = 0;
    var numRulersVOld = 0;
    
    if (this.layout_)
    {
        numVideosOld = this.panel_.find(".video-container").size();
        numRulersHOld = this.panel_.find(".horz-ruler").size();
        numRulersVOld = this.panel_.find(".vert-ruler").size();
    }

    this.layout_ = this.Layouts[id];

    var numVideosNew = this.layout_.numVideos_;
    var numRulersHNew = this.layout_.numHRulers_;
    var numRulersVNew = this.layout_.numVRulers_;

    //console.log("H " + numRulersHNew + " " + numRulersHOld + "V " + numRulersVNew + " " + numRulersVOld);

    this.EnsureElements("horz-ruler", numRulersHNew, numRulersHOld);
    this.EnsureElements("vert-ruler", numRulersVNew, numRulersVOld);
    this.EnsureElements("video-container", numVideosNew, numVideosOld);

    for (var i = numVideosOld; i < numVideosNew; ++i)
    {
        var testUrl = this.streamSource_.NextStreamUrl();
        var videoContainer = this.panel_.find("#" + UI.ID_PREFIX_ + i + ".video-container");
        videoContainer.find("#video-content").attr("src", testUrl);
    }

    this.OnResize();
}

StreamLayout.prototype.EnsureElements = function(className, newNum, oldNum)
{
    for (var i = oldNum; i < newNum; ++i)
    {
        var htmlString = this.GetHTMLFor(className);
        var element = this.panel_.append(htmlString).children().last();
        element.attr("id", UI.ID_PREFIX_ + i);
        this.EnsureEventHandlers(element, className);
    }

    for (var i = 0; i < newNum; ++i)
    {            
        var element = this.panel_.find("#" + UI.ID_PREFIX_ + i + "." + className);
        element.removeClass('hide');
    }

    for (var i = newNum; i < oldNum; ++i)
    {
        var element = this.panel_.find("#" + UI.ID_PREFIX_ + i + "." + className);
        element.addClass('hide');
    }
}

StreamLayout.prototype.EnsureEventHandlers = function(element, className)
{
    var onRulerMove = this.OnRulerDrag.bind(this);
    var onRulerUp = this.OnRulerUp.bind(this);
    var onVideoUp = this.OnVideoUp.bind(this);
    
    if (className === "video-container")
    {
        element.on('mousedown', function(element, evt) { 
            var parentBounds = this.panel_.get(0).getBoundingClientRect();
            var elementBounds = element.get(0).getBoundingClientRect();

            this.currentDraggedVideo_ = element;
            this.MakeContainerTopmost(element);
            this.originalDragId_ = element.attr("id");

            element.css("pointer-events", "none");
            element.find(".video-player").addClass("shadow-big");

            var bounds = {
                minX: -1000,
                minY: -1000,
                maxX: parentBounds.width,
                maxY: parentBounds.height
            };

            this.VideoContainerAnimation(element, false);
            this.draggingContext_.StartDrag(evt, element, false, false, bounds, null, onVideoUp);  
        }.bind(this, element));

        element.on('mousemove', function(element, evt) { 
            if (this.currentDraggedVideo_ !== null)
            {
                if ((element.attr("id") !== this.currentDraggedVideo_.attr("id")) && !element.data('intransition'))
                {
                    var newId = element.attr("id");
                    var currentId = this.currentDraggedVideo_.attr("id");
                    //if (currentId !== this.originalDragId_)
                    {
                        var prevSwappedElem = this.panel_.find("#" + this.originalDragId_ + ".video-container");
                        prevSwappedElem.attr("id", currentId);
                        prevSwappedElem.data('intransition', true);
                    }

                    if (newId !== this.originalDragId_)
                    {
                        element.attr("id", this.originalDragId_)
                        element.data('intransition', true);
                    }

                    this.currentDraggedVideo_.attr("id", newId);

                    this.OnResize();
                }
            }
        }.bind(this, element));

        element.on('transitionend', function(element, evt) { 
            element.data('intransition', false);
        }.bind(this, element));
    }
    else if (className === "horz-ruler")
    {
        element.on('mousedown', function(element, evt) { 
            var id = parseInt(UI.GetID(element));
            var parentBounds = this.panel_.get(0).getBoundingClientRect();

            var bounds = {
                minY: id <= 0 ? this.videoMargin_ : this.layout_.rulersH_[id - 1] * parentBounds.height + this.videoMargin_ * 2,
                maxY: id < this.layout_.numHRulers_ - 1 ? this.layout_.rulersH_[id + 1] * parentBounds.height - this.videoMargin_ * 2 : parentBounds.height - this.videoMargin_ * 2 
            };    

            //console.log(bounds);

            this.VideoContainerAnimation(this.panel_.find(".video-container"), false);
            this.draggingContext_.StartDrag(evt, element, true, false, bounds, onRulerMove, onRulerUp);  
        }.bind(this, element));
    }
    else if (className === "vert-ruler")
    {
        element.on('mousedown', function(element, evt) { 
            var id = parseInt(UI.GetID(element));
            var parentBounds = this.panel_.get(0).getBoundingClientRect();
            var row = parseInt(element.attr("gridY"));
            var col = parseInt(element.attr("gridX"));

            //console.log("DRAG " + col + " " + row + " " + this.layout_.scheme_[row + 1]);

            var bounds = {
                minX: col <= 0 ? this.videoMargin_ : this.layout_.rulersV_[id - 1] * parentBounds.width + this.videoMargin_ * 2,
                maxX: col < this.layout_.scheme_[row + 1] - 2 ? this.layout_.rulersV_[id + 1] * parentBounds.width - this.videoMargin_ * 2 : parentBounds.width - this.videoMargin_ * 2 
            };    

            this.VideoContainerAnimation(this.panel_.find(".video-container"), false);
            this.draggingContext_.StartDrag(evt, element, false, true, bounds, onRulerMove, onRulerUp);  
        }.bind(this, element));
    }
}

StreamLayout.prototype.MakeContainerTopmost = function(container)
{
    this.panel_.children().css("z-index", 0);
    container.css("z-index", 1);
}

StreamLayout.prototype.VideoContainerAnimation = function(container, on)
{
    var player = container.find(".video-player");

    if (on)
    {
        container.addClass("animable-fast");
        player.addClass("animable-fast");
    }
    else
    {
        container.removeClass("animable-fast");
        player.removeClass("animable-fast");
    }
}

StreamLayout.prototype.OnRulerUp = function(element)
{
    this.VideoContainerAnimation(this.panel_.find(".video-container"), true);
}

StreamLayout.prototype.OnVideoUp = function(element)
{
    element.css("pointer-events", "initial");
    element.find(".video-player").removeClass("shadow-big");
    this.currentDraggedVideo_ = null;
    this.originalDragId_ = null;
    this.VideoContainerAnimation(element, true);
    this.OnResize();
}

StreamLayout.prototype.OnRulerDrag = function(element)
{
    var id = parseInt(UI.GetID(element));
    var bounds = this.panel_.get(0).getBoundingClientRect();

    if (element.hasClass("horz-ruler"))
    {
        this.layout_.rulersH_[id] = parseInt(element.css("top")) / bounds.height;
    }
    else
    {
        this.layout_.rulersV_[id] = parseInt(element.css("left")) / bounds.width;
        //console.log(this.layout_.rulersV_)
    }

    this.OnResize();
}

StreamLayout.prototype.GetHTMLFor = function(className)
{
    var htmlString = "";

    if (className === "video-container")
    {
        htmlString += "<div class='video-container animable-fast'>";
        htmlString += "<div class='video-player animable-fast'>";
        htmlString += "<img class='video-content' id='video-content'>";
        htmlString += "<div class='info'><div class='time'>05:50</div><div class='nick'>Sippul</div></div>";
        //htmlString += "<div class='cover animable'></div>";
        htmlString += "</div>";
        htmlString += "</div>";        
    }
    else if (className === "horz-ruler")
    {
        htmlString += "<div class='horz-ruler'></div>";        
    }
    else if (className === "vert-ruler")
    {
        htmlString += "<div class='vert-ruler'></div>";        
    }

    return htmlString;
}
