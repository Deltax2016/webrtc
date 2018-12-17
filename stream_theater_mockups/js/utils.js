'use strict'

function Utils() {}

Utils.SizeAndPosWithAspect = function(width, height, size, aspect)
{
    var result = {};

    if (width / height > aspect)
    {
        result.cellHeight_ = height / size;
        result.cellWidth_ = result.cellHeight_ * aspect;
        result.xShift_ = (width - result.cellWidth_ * size) / 2;
        result.yShift_ = 0; 
    }
    else
    {
        result.cellWidth_ = width / size;
        result.cellHeight_ = result.cellWidth_ / aspect;
        result.xShift_ = 0;
        result.yShift_ = (height - result.cellHeight_ * size) / 2; 
    }

    return result;
}
