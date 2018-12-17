'use strict'

function TestStreamSource()
{
    this.nextWEBPId_ = 0;
}

TestStreamSource.prototype.NextStreamUrl = function()
{
    if (this.nextWEBPId_ == 2 || this.nextWEBPId_ == 21 || this.nextWEBPId_ == 16)
        this.nextWEBPId_++;

    var img = "img/200(" + this.nextWEBPId_ + ").webp";

    this.nextWEBPId_++;
    if (this.nextWEBPId_ > 24)
        this.nextWEBPId_ = 0;

    return img;
}

TestStreamSource.prototype.BuildVideoContainer = function(sourceUrl, withCover, withInfo)
{
    var htmlString = "<div class='video-container animable-fast'>";
    htmlString += "<div class='video-player animable-fast'>";

    if (sourceUrl)
        htmlString += "<img class='video-content' src='" + sourceUrl + "'>";
    
    if (withInfo)
        htmlString += "<div class='info'><div class='time'>05:50</div><div class='nick'>Sippul</div></div>";

    if (withCover)
        htmlString += "<div class='cover animable'></div>";
    
    htmlString += "</div>";
    htmlString += "</div>";

    return htmlString;
}


TestStreamSource.prototype.NextStreamContainer = function()
{
    var htmlString = "<img class='video' src='" + this.NextStreamUrl() + "'>";
    return htmlString;
}
