'use strict'

function DraggableElement(element, startX, startY, lockX, lockY, bounds)
{
    this.element_ = element;
    this.bounds_ = bounds;
    this.elementParent_ = 
    this.lockX_ = lockX;
    this.lockY_ = lockY;
    this.startX_ = startX;
    this.startY_ = startY;

    if (!this.lockX_)
        this.X_ = parseInt(this.element_.css("left"));

    if (!this.lockY_)
        this.Y_ = parseInt(this.element_.css("top"));
}

DraggableElement.prototype.OnMove = function(evt)
{
    if (this.element_ === null)
        return;

    if (!this.lockX_)
    {
        var newX = this.X_ + (evt.clientX - this.startX_);

        newX = Math.max(this.bounds_.minX, newX);
        newX = Math.min(this.bounds_.maxX, newX);

        this.element_.css("left", newX + "px");
    }

    if (!this.lockY_)
    {
        var newY = this.Y_ + (evt.clientY - this.startY_);

        newY = Math.max(this.bounds_.minY, newY);
        newY = Math.min(this.bounds_.maxY, newY);

        this.element_.css("top", newY + "px");
    }
}

DraggableElement.prototype.OnUp = function(evt)
{
    if (this.element_ === null)
        return;

    this.element_ = null;
}


function DraggingContext()
{
    this.draggableElement_ = null;
    this.onMove_ = null;
    this.onUp_ = null;

    document.addEventListener("mousemove", function(evt) { this.OnMove(evt); }.bind(this));
    document.addEventListener("mouseup", function(evt) { this.OnUp(evt); }.bind(this));
}

DraggingContext.prototype.StartDrag = function(evt, element, lockX, lockY, bounds, onMove, onUp)
{
    this.draggableElement_ = new DraggableElement(element, evt.clientX, evt.clientY, lockX, lockY, bounds);
    this.onMove_ = onMove;
    this.onUp_ = onUp;
}

DraggingContext.prototype.OnMove = function(evt)
{
    if (this.draggableElement_)
    {
        this.draggableElement_.OnMove(evt);

        if (this.onMove_)
            this.onMove_(this.draggableElement_.element_);
    }
}

DraggingContext.prototype.OnUp = function(evt)
{
    if (this.onUp_)
        this.onUp_(this.draggableElement_.element_);

    if (this.draggableElement_)
        this.draggableElement_.OnUp(evt);

    this.draggableElement_ = null;
    this.onMove_ = null;
    this.onUp_ = null;
}
