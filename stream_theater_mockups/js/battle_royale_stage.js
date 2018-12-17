'use strict'

function BattleRoyaleStage(panel, streamSource)
{
    this.panel_ = (typeof panel === 'string') ? $(panel) : panel;
    this.streamSource_ = streamSource;

    this.numStreams_ = 0;
    this.numVisibleStreams_ = 0;
    this.numLiveStreams_ = 0;
    this.currentSize_ = 1;
    this.videoAspect_ = 16.0/9.0;
    this.cellBorder_ = 2;
    
    window.addEventListener('resize', function(evt) { return this.OnResize(); }.bind(this));

    this.deadTimer_ = setTimeout(this.KillSomeone.bind(this), 1000);
}

BattleRoyaleStage.prototype.KillSomeone = function()
{
    if (this.numLiveStreams_ < 2)
        return;

    var idToKill = Math.round(Math.random() * (this.numLiveStreams_ - 1));

    console.log('KILL ' + idToKill);

    for (var i = 0, liveCount = 0; i < this.numStreams_; ++i)
    {
        var cell = this.panel_.children().eq(i);

        if (cell.find('#cover').hasClass('dead'))
            continue;

        if (liveCount === idToKill)
        {
            cell.find('#cover').addClass('dead');
            this.numLiveStreams_--;
        }

        liveCount++;
    }

    var newSize = Math.ceil(Math.sqrt(this.numLiveStreams_));

    if (newSize < this.currentSize_)
    {
        this.currentSize_ = newSize;
        for (var i = 0, liveCount = 0; i < this.numStreams_; ++i)
        {
            var cell = this.panel_.children().eq(i);
            if (cell.find('#cover').hasClass('dead') && !cell.hasClass('hide'))
            {
                cell.addClass('hide');
                this.numVisibleStreams_--;
            }
        }

        this.OnResize();        
    }

    this.deadTimer_ = setTimeout(this.KillSomeone.bind(this), Math.random() * 1000);
}

BattleRoyaleStage.prototype.OnResize = function() 
{
    var bounds = this.panel_.get(0).getBoundingClientRect();
    console.log('ON RESIZE', bounds.width, bounds.height);

    var cellSize = Utils.SizeAndPosWithAspect(bounds.width, bounds.height, this.currentSize_, this.videoAspect_);

    var visCount = 0 ; 
    var count = 0;
    for (var i = 0; i < this.currentSize_ && visCount < this.numVisibleStreams_; ++i)
    {
        for (var j = 0; j < this.currentSize_ && visCount < this.numVisibleStreams_; ++j)
        {
            var cell = null;
            do
            {
                cell = this.panel_.children().eq(count);
                count++;
            } while(cell.hasClass('hide'))

            var cellWidth = cellSize.cellWidth_ - 2 * this.cellBorder_ + 'px';

            cell.css('width', cellWidth);
            cell.css('height', cellSize.cellHeight_ - 2 * this.cellBorder_ + 'px');
            cell.css('left', cellSize.xShift_ + j * cellSize.cellWidth_ + this.cellBorder_ + 'px');
            cell.css('top', cellSize.yShift_ + i * cellSize.cellHeight_ + this.cellBorder_ + 'px');
            visCount++;
        }
    }
}

BattleRoyaleStage.prototype.StartStage = function(numStreams) 
{
    if (numStreams < 1 || numStreams > 100)
    {
        console.log("Wrong stream number");
        return;
    }

    this.numStreams_ = numStreams;
    this.numLiveStreams_ = numStreams;
    this.numVisibleStreams_ = numStreams;
    this.currentSize_ = Math.ceil(Math.sqrt(this.numLiveStreams_));

    var count = 0 ; 
    for (var i = 0; i < this.currentSize_ && count < this.numLiveStreams_; ++i)
    {
        for (var j = 0; j < this.currentSize_ && count < this.numLiveStreams_; ++j)
        {
            var htmlString = "<div class='stream-cell animable shadow'>";
            htmlString += this.streamSource_.NextStreamContainer();
            htmlString += "<div class='cover animable' id='cover'><p class='text'>DEAD</p></div>";
            htmlString += "</div>";
            this.panel_.append(htmlString);
            count++;
        }
    }

    this.OnResize();
}
